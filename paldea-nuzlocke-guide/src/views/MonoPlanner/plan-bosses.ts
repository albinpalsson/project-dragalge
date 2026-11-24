import type {
    BossBattleRoster,
    BossPokemonView,
} from '../../db/pokemon-data/queries';
import { getEncounterGroupKey } from '../../pokemon-species';
import { getNemonaBattleName } from '../../db/pokemon-data/starter-battles';
import { defensiveEffectiveness } from '../../utils/type-effectiveness';
import { PROGRESSION_ITEMS } from '../Game/progression/progression-items';
import type { BossConfig } from './boss-config';
import { countCatches } from './count-catches';
import {
    ASSUMED_EVOLUTIONS,
    getFormChangeAvailableAfter,
    getStoneAvailableAfter,
} from './evolution-assumptions';
import type {
    BossAttackTrace,
    BossCandidate,
    BossMatchupTrace,
    BossMemberTrace,
    BossStep,
    CandidateForm,
    DifficultyLevel,
    FightLimits,
    PlanContext,
    PlanState,
    PoolSpecies,
    SlotExpectation,
} from './plan-types';

/** A move counts as a threat from this share of the Pokémon's best move. */
const RELEVANT_POWER_RATIO = 0.6;
/** A guaranteed Pokémon that resists everything from this share counts double. */
const GUARANTEED_WALL_SHARE = 0.5;
/** Matchup score when it holds and hits at least twice as hard as it is hit. */
const CLEAR_WIN_SCORE = 1.25;
/** Matchup score when it holds but is hit harder than it hits back. */
const LOSING_TRADE_SCORE = 0.5;
/**
 * Answer score factor by base stat total compared with the boss team's
 * weighted average, highest tier first. Base stats are a rough measure, so a
 * few tiers are enough.
 */
export const BASE_STAT_TIERS: readonly { atLeast: number; factor: number }[] = [
    { atLeast: 0.85, factor: 1 },
    { atLeast: 0.65, factor: 0.6 },
    { atLeast: 0, factor: 0.3 },
];
const EPSILON = 1e-9;
const LEVEL_ORDER: readonly DifficultyLevel[] = ['ok', 'orange', 'red'];

/** Position of every progression item, to compare when things unlock. */
export const PROGRESSION_INDEX: ReadonlyMap<string, number> = new Map(
    PROGRESSION_ITEMS.map((item, index) => [item.key, index]),
);

const LEVEL_EDGE = /^level (\d+)\b/i;
const FRIENDSHIP_EDGE = /^level up with high friendship\b/i;
const LETS_GO_EDGE = /\busing the let's go! feature\b/i;

export function scoreBoss(
    context: PlanContext,
    state: PlanState,
    key: string,
    config: BossConfig,
): BossStep {
    const battleName = config.nemonaSecondBattle
        ? getNemonaBattleName(context.nemonaStarter, 'Second')
        : (config.battleName ?? '');
    const roster = context.data.bossRosters.get(battleName);
    if (!roster) {
        throw new Error(`No boss roster loaded for ${battleName}.`);
    }

    const members = buildBossMembers(context, config, roster);
    const totalWeight = members.reduce((sum, member) => sum + member.weight, 0);
    const team: BossTeam = {
        members,
        totalWeight,
        baseStats: getTeamBaseStats(context, members),
    };
    const levelCap = Math.max(0, ...members.map((member) => member.level));
    const required = Math.ceil(totalWeight / 2);
    const orangeAt = (required * 2) / 3;
    const fight: FightLimits = {
        levelCap,
        bossIndex: PROGRESSION_INDEX.get(key) ?? Number.POSITIVE_INFINITY,
        fullyEvolved: config.fullyEvolved,
    };

    const guaranteedSpecies: EvaluatedSpecies[] = [];
    const optionalByName = new Map<string, EvaluatedSpecies>();
    const slotExpectations: SlotExpectation[] = [];
    let optionalSlots = 0;
    for (const slot of state.slots) {
        if (slot.kind === 'guaranteed') {
            guaranteedSpecies.push(
                evaluateCandidate(
                    context,
                    slot.pool[0],
                    true,
                    [slot.locationName],
                    team,
                    fight,
                ),
            );
            continue;
        }
        optionalSlots += 1;
        let expected = 0;
        let best = 0;
        for (const species of slot.pool) {
            let evaluated = optionalByName.get(species.name);
            if (evaluated) {
                for (const form of getForms(evaluated)) {
                    form.locations.push(slot.locationName);
                }
            } else {
                evaluated = evaluateCandidate(
                    context,
                    species,
                    false,
                    [slot.locationName],
                    team,
                    fight,
                );
                optionalByName.set(species.name, evaluated);
            }
            // The slot rolls one species, so it adds the chance-weighted
            // average answer value of its pool.
            const value = getBestForm(evaluated).value;
            expected += species.chance * value;
            best = Math.max(best, value);
        }
        slotExpectations.push({
            locationName: slot.locationName,
            species: slot.pool.length,
            expected,
            best,
        });
    }
    // One entry per Pokémon that would actually be fielded, so a species and
    // its own evolution (or two guaranteed catches of one species) do not
    // count twice. A guaranteed catch also hides the same Pokémon as an option.
    // Evolutions such as Eevee's are listed as their own entries but a catch
    // is only one of them, so the sum uses the best entry per species.
    const guaranteedScored = mergeByForm(
        guaranteedSpecies.map(getBestForm),
        [],
    );
    const guaranteedForms = mergeByForm(
        guaranteedSpecies.flatMap(getForms),
        [],
    );
    const optional = mergeByForm(
        [...optionalByName.values()].flatMap(getForms),
        guaranteedForms.map(getFormKey),
    );

    const optionalExpected = slotExpectations.reduce(
        (sum, slot) => sum + slot.expected,
        0,
    );
    const guaranteedSum = guaranteedScored.reduce(
        (sum, entry) => sum + entry.value,
        0,
    );
    const score = optionalExpected + guaranteedSum;

    // A key Pokémon (a Tera ace, Starmobile or Titan, the ones that count
    // double) that nothing available can take hits from makes the fight Hard,
    // however well the rest of the team is covered.
    const candidates = [...guaranteedForms, ...optional];
    const unanswered = members.filter(
        (member, index) =>
            member.weight > 1 &&
            !candidates.some((candidate) => candidate.matchups[index]?.holds),
    );

    let level: DifficultyLevel = 'ok';
    if (score < orangeAt - EPSILON || unanswered.length > 0) {
        level = 'red';
    } else if (score < required - EPSILON) {
        level = 'orange';
    }
    if (
        config.maxLevel &&
        LEVEL_ORDER.indexOf(level) > LEVEL_ORDER.indexOf(config.maxLevel)
    ) {
        level = config.maxLevel;
    }

    return {
        kind: 'boss',
        key,
        label: config.label,
        battleName,
        teraType: members.find((member) => member.teraType)?.teraType,
        starType: config.starType,
        levelCap,
        fullyEvolved: config.fullyEvolved ?? false,
        totalWeight,
        teamBaseStats: team.baseStats,
        required,
        orangeAt,
        members,
        locationsWalked: countCatches(context, state.slots),
        guaranteedSlots: state.slots.length - optionalSlots,
        optionalSlots,
        guaranteed: guaranteedForms,
        optional,
        slotExpectations,
        optionalExpected,
        guaranteedSum,
        score,
        // Several boss Pokémon can share a name.
        unanswered: [
            ...new Set(unanswered.map((member) => member.pokemonName)),
        ],
        level,
    };
}

/** The boss team as every candidate is scored against it. */
interface BossTeam {
    members: readonly BossMemberTrace[];
    totalWeight: number;
    /** Weighted average base stat total, 0 when unknown. */
    baseStats: number;
}

/**
 * Weighted like the score, so the ace counts double. A Starmobile is stored as
 * a plain Revavroom (500), which is a fair stand-in for its boosted stats.
 */
function getTeamBaseStats(
    context: PlanContext,
    members: readonly BossMemberTrace[],
): number {
    let sum = 0;
    let weight = 0;
    for (const member of members) {
        const total = context.data.baseStatTotals[member.pokemonName] ?? 0;
        if (total > 0) {
            sum += member.weight * total;
            weight += member.weight;
        }
    }
    return weight > 0 ? sum / weight : 0;
}

/** Answer score factor for a candidate's base stats against the boss team. */
function getBaseStatFactor(baseStats: number, teamBaseStats: number): number {
    if (baseStats <= 0 || teamBaseStats <= 0) {
        return 1;
    }
    const ratio = baseStats / teamBaseStats;
    return (
        BASE_STAT_TIERS.find((tier) => ratio >= tier.atLeast - EPSILON)
            ?.factor ?? 1
    );
}

/**
 * The Pokémon a candidate is fielded as, which is what makes two the same.
 * Cosmetic forms such as Gastrodon (East Sea) and (West Sea) are one Pokémon.
 */
function getFormKey(candidate: BossCandidate): string {
    return getEncounterGroupKey(candidate.form?.name ?? candidate.name);
}

/**
 * Keeps one candidate per fielded Pokémon (the first one wins) and merges the
 * places it can be obtained. Candidates whose form is in `excludedForms` are
 * dropped.
 */
function mergeByForm(
    candidates: readonly BossCandidate[],
    excludedForms: readonly string[],
): BossCandidate[] {
    const excluded = new Set(excludedForms);
    const byForm = new Map<string, BossCandidate>();
    for (const candidate of candidates) {
        const formKey = getFormKey(candidate);
        if (excluded.has(formKey)) {
            continue;
        }
        const sources = candidate.locations.map((location) =>
            candidate.name === (candidate.form?.name ?? candidate.name)
                ? location
                : `${location} (as ${candidate.name})`,
        );
        const existing = byForm.get(formKey);
        if (existing) {
            existing.locations = [
                ...new Set([...existing.locations, ...sources]),
            ];
            continue;
        }
        byForm.set(formKey, {
            ...candidate,
            locations: [...new Set(sources)],
        });
    }
    return [...byForm.values()];
}

function getStab(
    moveType: string,
    types: ReadonlySet<string>,
    teraType: string | undefined,
): number {
    if (teraType && moveType === teraType) {
        // A Tera type gives x1.5, or x2 when it is also an original type (the
        // game's cap, not 1.5 x 1.5). Original types keep their x1.5 below.
        return types.has(teraType) ? 2 : 1.5;
    }
    return types.has(moveType) ? 1.5 : 1;
}

function buildBossMembers(
    context: PlanContext,
    config: BossConfig,
    roster: BossBattleRoster,
): BossMemberTrace[] {
    let pokemon: BossPokemonView[] = [...roster.pokemon].sort(
        (first, second) => first.slot - second.slot,
    );
    if (config.versionPokemon) {
        const versionName = config.versionPokemon[context.inputs.variant];
        pokemon = pokemon.filter(
            (candidate) => candidate.pokemonName === versionName,
        );
    }
    if (config.titan) {
        // Titan phases repeat the same Pokémon; count each one once, keeping
        // the last (strongest) phase.
        const all = pokemon;
        pokemon = all.filter(
            (candidate, index) =>
                !all
                    .slice(index + 1)
                    .some(
                        (later) => later.pokemonName === candidate.pokemonName,
                    ),
        );
    }

    const { starType } = config;
    const aceSlot = pokemon.at(-1)?.slot;

    return pokemon.map((member) => {
        const isAce = member.slot === aceSlot;
        const isStarmobile =
            isAce &&
            starType !== undefined &&
            member.pokemonName === 'Revavroom';
        const primaryType =
            isStarmobile && starType ? starType : member.primaryType;
        const secondaryType = isStarmobile ? '' : member.secondaryType;
        const teraType = isAce && !isStarmobile ? config.teraType : undefined;
        const types = new Set([primaryType, secondaryType].filter(Boolean));

        const rawAttacks = member.moves
            .filter((move) => move.power > 0)
            .map((move) => {
                const stab = getStab(move.type, types, teraType);
                return {
                    moveName: move.name,
                    moveType: move.type,
                    power: move.power,
                    stab,
                    effectivePower: move.power * stab,
                };
            });
        const best = Math.max(
            0,
            ...rawAttacks.map((attack) => attack.effectivePower),
        );
        const attacks: BossAttackTrace[] = rawAttacks.map((attack) => ({
            ...attack,
            relevant:
                attack.effectivePower >= best * RELEVANT_POWER_RATIO - EPSILON,
        }));

        let note: string | undefined;
        if (isStarmobile) {
            note = `Starmobile (${primaryType}), counts double.`;
        } else if (teraType) {
            note = 'Tera ace, counts double.';
        } else if (config.titan) {
            note = 'Titan, counts double.';
        }
        return {
            slot: member.slot,
            pokemonName: member.pokemonName,
            level: member.level,
            primaryType,
            secondaryType,
            weight: config.titan || isStarmobile || teraType ? 2 : 1,
            teraType,
            // A Terastallized Pokémon defends with its Tera type alone.
            defenseTypes: teraType ? [teraType] : [...types],
            note,
            attacks,
            threatTypes: [
                ...new Set(
                    attacks
                        .filter((attack) => attack.relevant)
                        .map((attack) => attack.moveType),
                ),
            ],
        };
    });
}

/**
 * The forms of a species the player can field at the boss: the encountered
 * form and every descendant reachable by plain "level N" evolutions up to the
 * level cap, by friendship or the Let's Go! feature at any level, or by an
 * evolution stone available
 * before this fight, or by a form change into the mono type, plus the
 * evolutions in ASSUMED_EVOLUTIONS that are available by this fight. Only
 * forms allowed in the run count. That is the mono type, or, with future
 * evolutions on, a Pokémon that will evolve into it, which may be fielded with
 * its own typing. Every reachable form is returned; scoring fields
 * the furthest one.
 */
export function getUsableForms(
    context: PlanContext,
    species: PoolSpecies,
    fight: FightLimits,
): {
    forms: CandidateForm[];
    /** Forms from ASSUMED_EVOLUTIONS, listed as separate entries. */
    assumedForms: CandidateForm[];
    reason?: string;
} {
    const { bossIndex } = fight;
    const levelCap = fight.fullyEvolved
        ? Number.POSITIVE_INFINITY
        : fight.levelCap;
    const forms: CandidateForm[] = [];
    const assumedForms: CandidateForm[] = [];
    const visited = new Set<string>();
    // The forms each collected form evolved through, from the encountered one.
    const pathByName = new Map<string, readonly string[]>();
    const pending: {
        name: string;
        requiredLevel: number;
        stage: number;
        path: readonly string[];
    }[] = [
        { name: species.memberNames[0], requiredLevel: 0, stage: 0, path: [] },
    ];
    const isUnlocked = (progressionKey: string) =>
        (PROGRESSION_INDEX.get(progressionKey) ?? Number.POSITIVE_INFINITY) <
        bossIndex;

    while (pending.length > 0) {
        const current = pending.pop();
        if (!current || visited.has(current.name)) {
            continue;
        }
        visited.add(current.name);
        const entry = context.typesByName.get(current.name);
        if (entry && context.monoEligible.has(current.name)) {
            forms.push({
                name: current.name,
                primaryType: entry.primaryType,
                secondaryType: entry.secondaryType,
                requiredLevel: current.requiredLevel,
                stage: current.stage,
            });
            pathByName.set(current.name, current.path);
        }
        const edges =
            context.data.evolutionGraph.getNode(current.name)?.nextEvolutions ??
            [];
        for (const edge of edges) {
            const match = LEVEL_EDGE.exec(edge.method);
            const stoneAfter = getStoneAvailableAfter(edge.method);
            const assumed = ASSUMED_EVOLUTIONS[current.name]?.find(
                (candidate) => candidate.to === edge.pokemonName,
            );
            if (assumed?.variant && assumed.variant !== context.inputs.variant) {
                continue;
            }
            const next = {
                name: edge.pokemonName,
                stage: current.stage + 1,
                path: [...current.path, current.name],
            };
            if (match) {
                const requiredLevel = Math.max(
                    current.requiredLevel,
                    Number(match[1]),
                );
                if (requiredLevel <= levelCap) {
                    pending.push({ ...next, requiredLevel });
                }
                continue;
            }
            if (stoneAfter && isUnlocked(stoneAfter)) {
                // A stone works at any level once it can be had.
                pending.push({ ...next, requiredLevel: current.requiredLevel });
                continue;
            }
            const formChangeAfter = getFormChangeAvailableAfter(edge.method);
            if (formChangeAfter) {
                // Forms switch both ways, so only change into the mono type.
                const changeTarget = context.typesByName.get(edge.pokemonName);
                if (
                    isUnlocked(formChangeAfter) &&
                    !hasMonoType(context, entry) &&
                    hasMonoType(context, changeTarget)
                ) {
                    pending.push({
                        ...next,
                        requiredLevel: current.requiredLevel,
                    });
                }
                continue;
            }
            if (
                (FRIENDSHIP_EDGE.test(edge.method) ||
                    LETS_GO_EDGE.test(edge.method)) &&
                !assumed
            ) {
                pending.push({ ...next, requiredLevel: current.requiredLevel });
                continue;
            }
            if (fight.fullyEvolved && !assumed) {
                // Stones, trades, friendship and the like all count as done.
                pending.push({ ...next, requiredLevel: current.requiredLevel });
                continue;
            }
            const target = context.typesByName.get(edge.pokemonName);
            const requiredLevel = Math.max(
                current.requiredLevel,
                assumed?.level ?? 0,
            );
            if (
                assumed &&
                target &&
                context.monoEligible.has(edge.pokemonName) &&
                requiredLevel <= levelCap &&
                (assumed.availableAfter === undefined ||
                    isUnlocked(assumed.availableAfter))
            ) {
                // Kept apart from the level-up forms: the player decides
                // whether to evolve, so it is its own entry.
                assumedForms.push({
                    name: edge.pokemonName,
                    primaryType: target.primaryType,
                    secondaryType: target.secondaryType,
                    requiredLevel,
                    stage: next.stage,
                });
                pathByName.set(edge.pokemonName, next.path);
            }
        }
    }

    // The encountered form is always allowed, so this only happens when the
    // Pokémon has no typing data.
    if (forms.length === 0) {
        return {
            forms,
            assumedForms,
            reason: 'No typing data for this Pokémon',
        };
    }
    if (!fight.fullyEvolved) {
        return { forms, assumedForms };
    }
    // Everything has had the chance to evolve, so a form that has an allowed
    // further evolution is no longer an option.
    const allowed = [...forms, ...assumedForms];
    const keep = (form: CandidateForm) =>
        !allowed.some((other) =>
            pathByName.get(other.name)?.includes(form.name),
        );
    return {
        forms: forms.filter(keep),
        assumedForms: assumedForms.filter(keep),
    };
}

function hasMonoType(
    context: PlanContext,
    entry: { primaryType: string; secondaryType: string } | undefined,
): boolean {
    return (
        entry?.primaryType === context.inputs.monoType ||
        entry?.secondaryType === context.inputs.monoType
    );
}

/**
 * A species as met in a slot. `main` is the Pokémon itself (or its best
 * level-up form). `variants` are evolutions from ASSUMED_EVOLUTIONS, kept as
 * separate entries. A single catch is only one of them, so scoring uses the
 * best one.
 */
interface EvaluatedSpecies {
    main: BossCandidate;
    variants: BossCandidate[];
}

function evaluateCandidate(
    context: PlanContext,
    species: PoolSpecies,
    guaranteed: boolean,
    locations: string[],
    team: BossTeam,
    fight: FightLimits,
): EvaluatedSpecies {
    const { members, totalWeight } = team;
    const { forms, assumedForms, reason } = getUsableForms(
        context,
        species,
        fight,
    );
    const base = {
        name: species.name,
        iconName: species.memberNames[0],
        guaranteed,
        locations,
    };

    const evaluateForm = (form: CandidateForm): BossCandidate => {
        const matchups = members.map((member) =>
            getMatchup(context, form, member),
        );
        let scored = 0;
        let walled = 0;
        for (const [index, member] of members.entries()) {
            scored += member.weight * matchups[index].score;
            if (matchups[index].walls) {
                walled += member.weight;
            }
        }
        const coverage = scored / totalWeight;
        const wallCoverage = walled / totalWeight;
        const baseStats = context.data.baseStatTotals[form.name] ?? 0;
        const baseStatFactor = getBaseStatFactor(baseStats, team.baseStats);
        const answer = Math.min(1, 2 * coverage) * baseStatFactor;
        const isWall =
            guaranteed && wallCoverage >= GUARANTEED_WALL_SHARE - EPSILON;
        return {
            ...base,
            form,
            coverage,
            wallCoverage,
            baseStats,
            baseStatFactor,
            answer,
            value: isWall ? answer * 2 : answer,
            matchups,
        };
    };

    const variants = assumedForms.map(evaluateForm);
    const candidates = forms.map(evaluateForm);

    // A player evolves by level-up or stone when they can, so the furthest
    // form is the one fielded. Branches at the same stage take the better
    // answer.
    candidates.sort(
        (first, second) =>
            (second.form?.stage ?? 0) - (first.form?.stage ?? 0) ||
            second.answer - first.answer,
    );
    const [best] = candidates;
    if (!best) {
        return {
            main: {
                ...base,
                unusableReason: reason,
                coverage: 0,
                wallCoverage: 0,
                baseStats: 0,
                baseStatFactor: 1,
                answer: 0,
                value: 0,
                matchups: [],
            },
            variants: [],
        };
    }
    return { main: best, variants };
}

function getForms(species: EvaluatedSpecies): BossCandidate[] {
    return [species.main, ...species.variants];
}

/** The entry that scores highest, the plain one winning ties. */
function getBestForm(species: EvaluatedSpecies): BossCandidate {
    return getForms(species).reduce((best, candidate) =>
        candidate.value > best.value + EPSILON ? candidate : best,
    );
}

function getMatchup(
    context: PlanContext,
    form: CandidateForm,
    member: BossMemberTrace,
): BossMatchupTrace {
    let worstType = '';
    let worstMultiplier = member.threatTypes.length === 0 ? 1 : -1;
    for (const threatType of member.threatTypes) {
        const multiplier = getMultiplier(
            context,
            threatType,
            form.primaryType,
            form.secondaryType,
        );
        if (multiplier > worstMultiplier) {
            worstMultiplier = multiplier;
            worstType = threatType;
        }
    }
    // Assume a solid move of each of the candidate's own types.
    let bestHitType = '';
    let bestHitMultiplier = -1;
    for (const hitType of [form.primaryType, form.secondaryType]) {
        if (!hitType) {
            continue;
        }
        const multiplier = getMultiplier(
            context,
            hitType,
            member.defenseTypes[0] ?? '',
            member.defenseTypes[1] ?? '',
        );
        if (multiplier > bestHitMultiplier) {
            bestHitMultiplier = multiplier;
            bestHitType = hitType;
        }
    }

    // A candidate that cannot take the hits is no answer however hard it hits
    // back. Otherwise compare the hits it deals with the hits it takes.
    const holds = worstMultiplier <= 1;
    let score = 0;
    if (holds && bestHitMultiplier >= 2 * worstMultiplier) {
        score = CLEAR_WIN_SCORE;
    } else if (holds && bestHitMultiplier >= worstMultiplier) {
        score = 1;
    } else if (holds) {
        score = LOSING_TRADE_SCORE;
    }
    return {
        member: member.pokemonName,
        holds,
        walls: member.threatTypes.length === 0 || worstMultiplier < 1,
        worstType,
        worstMultiplier,
        bestHitType,
        bestHitMultiplier,
        score,
    };
}

function getMultiplier(
    context: PlanContext,
    threatType: string,
    primaryType: string,
    secondaryType: string,
): number {
    const cacheKey = `${threatType}|${primaryType}|${secondaryType}`;
    const cached = context.multiplierCache.get(cacheKey);
    if (cached !== undefined) {
        return cached;
    }
    const multiplier =
        defensiveEffectiveness(
            context.data.typeChart,
            primaryType,
            secondaryType,
        ).find((entry) => entry.attackingType === threatType)?.multiplier ?? 1;
    context.multiplierCache.set(cacheKey, multiplier);
    return multiplier;
}
