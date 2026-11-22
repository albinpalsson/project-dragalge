import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import { getEncounterGroupKey } from '../../pokemon-species';
import { getMonoRunEligibleNames } from '../../utils/mono-run';
import { STARTER_NAMES } from '../../utils/starter-choices';
import { PROGRESSION_ITEMS } from '../Game/progression/progression-items';
import { BOSS_CONFIGS } from './boss-config';
import { MILESTONE_KEYS, MILESTONES } from './milestone-config';
import { getUsableForms, PROGRESSION_INDEX, scoreBoss } from './plan-bosses';
import { planLocation, planStarter } from './plan-locations';
import type {
    BossStep,
    CandidateForm,
    FightLimits,
    LocationStep,
    MilestoneEntry,
    MilestoneSnapshot,
    MonoPlan,
    MonoPlanData,
    MonoPlanInputs,
    PlanContext,
    PlanState,
    PlanStep,
} from './plan-types';

/*
 * Pure mono-type difficulty calculation. It walks PROGRESSION_ITEMS once, in
 * order, and keeps the running list of encounter "slots" (one per location
 * that still has a mono-eligible Pokémon) so every boss can be scored against
 * everything obtainable before it. Every decision is recorded in the result so
 * the UI can show how a number came to be. Tera Raids are not modelled.
 *
 * Locations are planned in plan-locations.ts and bosses scored in
 * plan-bosses.ts. Boss scoring in short:
 * - Each boss Pokémon has a weight (1; Titans, the Starmobile ace and an ace
 *   that Terastallizes 2).
 * - A move is a threat when its effective power (power x STAB, the ace's Tera
 *   type included) is at least 60% of that Pokémon's best.
 * - A candidate "holds" against a boss Pokémon when none of its threat types
 *   is super effective. A matchup it does not hold scores 0. Otherwise the
 *   candidate is assumed to have a solid move of each of its own types, and
 *   its best hit is compared with the worst hit it takes (the boss Pokémon's
 *   Tera type defends for a Tera ace): 1.25 when it hits at least twice as
 *   hard, 1 when at least as hard, 0.5 when it loses the trade.
 * - Coverage is the weighted average matchup score, and the answer value is
 *   min(1, 2 x coverage), scaled down for a Pokémon whose base stat total is
 *   well below the boss team's weighted average (BASE_STAT_TIERS).
 * - Required answers = ceil(total weight / 2).
 * - A Pokémon that counts double (Tera ace, Starmobile, Titan) and that no
 *   available candidate holds against makes the fight Hard.
 * - An optional slot rolls one species, so it adds the chance-weighted average
 *   answer value of its pool. The score is those expectations plus the
 *   guaranteed catches.
 */

/** Every location the planner needs encounter rows for. */
export const PLANNER_LOCATION_NAMES: readonly string[] = [
    ...new Set(
        PROGRESSION_ITEMS.flatMap((item) =>
            item.kind === 'encounter' &&
            item.locationName !== STARTER_LOCATION_NAME
                ? [item.locationName]
                : [],
        ),
    ),
];

export function calculateMonoPlan(
    inputs: MonoPlanInputs,
    data: MonoPlanData,
): MonoPlan {
    const monoEligible =
        getMonoRunEligibleNames(
            {
                monoRunEnabled: true,
                monoRunType: inputs.monoType,
                monoRunFutureEvolutions: inputs.futureEvolutions,
            },
            data.catalog,
            data.evolutionGraph,
        ) ?? new Set<string>();
    const context: PlanContext = {
        inputs,
        data,
        typesByName: new Map(
            data.catalog.pokemon.map((entry) => [entry.name, entry]),
        ),
        monoEligible,
        multiplierCache: new Map(),
        baseStatRange: getBaseStatRange(data.baseStatTotals),
        nemonaStarter:
            inputs.nemonaStarter === 'auto'
                ? (STARTER_NAMES.find((name) => monoEligible.has(name)) ??
                  STARTER_NAMES[0])
                : inputs.nemonaStarter,
    };
    const state: PlanState = {
        slots: [],
        guaranteedPokemonNames: [],
        guaranteedSpecies: [],
    };
    const steps: PlanStep[] = [];
    const rawMilestones = new Map<string, RawMilestone>();

    for (const item of PROGRESSION_ITEMS) {
        if (item.kind === 'encounter') {
            steps.push(
                item.locationName === STARTER_LOCATION_NAME
                    ? planStarter(context, state, item.key)
                    : planLocation(context, state, item.key, item.locationName),
            );
            continue;
        }
        if (item.kind !== 'boss') {
            continue;
        }
        const config = BOSS_CONFIGS[item.key];
        if (
            !config ||
            (config.group === 'teamStar' && !inputs.includeTeamStar)
        ) {
            continue;
        }
        const bossStep = scoreBoss(context, state, item.key, config);
        steps.push(bossStep);
        if (MILESTONE_KEYS.has(item.key)) {
            rawMilestones.set(item.key, {
                boxCount: state.slots.length,
                entries: snapshotTeam(context, state, {
                    levelCap: bossStep.levelCap,
                    bossIndex:
                        PROGRESSION_INDEX.get(item.key) ??
                        Number.POSITIVE_INFINITY,
                    fullyEvolved: config.fullyEvolved,
                }),
            });
        }
    }

    // The end of the game: every slot, and every item unlocked. `fullyEvolved`
    // ignores the level cap.
    const totalSpecies = snapshotTeam(context, state, {
        levelCap: 0,
        bossIndex: Number.POSITIVE_INFINITY,
        fullyEvolved: true,
    }).length;

    const locations = steps.filter(
        (step): step is LocationStep => step.kind === 'location',
    );
    const bosses = steps.filter(
        (step): step is BossStep => step.kind === 'boss',
    );
    return {
        steps,
        milestones: buildMilestones(rawMilestones),
        monoEligibleCount: monoEligible.size,
        summary: {
            // With the dupes clause, a catch needs a Pokémon not caught yet.
            totalEncounters: inputs.dupesClause
                ? Math.min(state.slots.length, totalSpecies)
                : state.slots.length,
            bosses: bosses.length,
            ok: bosses.filter((boss) => boss.level === 'ok').length,
            orange: bosses.filter((boss) => boss.level === 'orange').length,
            red: bosses.filter((boss) => boss.level === 'red').length,
            skippedLocations: locations.filter(
                (location) => location.outcome === 'skipped',
            ).length,
            guaranteedLocations: locations.filter(
                (location) => location.outcome === 'guaranteed',
            ).length,
            optionalLocations: locations.filter(
                (location) => location.outcome === 'optional',
            ).length,
        },
    };
}

function getBaseStatRange(totals: Readonly<Record<string, number>>): {
    min: number;
    max: number;
} {
    // Entries without stats are 0 and would stretch the range.
    const values = Object.values(totals).filter((total) => total > 0);
    return {
        min: values.length > 0 ? Math.min(...values) : 0,
        max: values.length > 0 ? Math.max(...values) : 0,
    };
}

interface RawMilestone {
    boxCount: number;
    entries: MilestoneEntry[];
}

/** Picks the primary or fallback snapshot for each configured milestone. */
function buildMilestones(
    raw: ReadonlyMap<string, RawMilestone>,
): MilestoneSnapshot[] {
    return MILESTONES.map((milestone) => {
        const primary = raw.get(milestone.key);
        const fallback = milestone.fallback
            ? raw.get(milestone.fallback.key)
            : undefined;
        if (
            milestone.fallback &&
            fallback &&
            (primary?.entries.length ?? 0) <= milestone.fallback.whenAtMost
        ) {
            return {
                id: milestone.id,
                label: milestone.fallback.label,
                key: milestone.fallback.key,
                usedFallback: true,
                boxCount: fallback.boxCount,
                entries: fallback.entries,
            };
        }
        return {
            id: milestone.id,
            label: milestone.label,
            key: milestone.key,
            usedFallback: false,
            boxCount: primary?.boxCount ?? 0,
            entries: primary?.entries ?? [],
        };
    });
}

/**
 * Everything that may be on the team at a fight, one entry per Pokémon as it
 * would be fielded. A catch shows as its best form by the level cap: a form of
 * the mono type if there is one, then the furthest evolution.
 */
function snapshotTeam(
    context: PlanContext,
    state: PlanState,
    fight: FightLimits,
): MilestoneEntry[] {
    const isMono = (form: CandidateForm) =>
        form.primaryType === context.inputs.monoType ||
        form.secondaryType === context.inputs.monoType;
    const { min, max } = context.baseStatRange;
    const byForm = new Map<string, MilestoneEntry>();
    for (const slot of state.slots) {
        for (const species of slot.pool) {
            const usable = getUsableForms(context, species, fight);
            const shown = [...usable.forms, ...usable.assumedForms].reduce<
                CandidateForm | undefined
            >((best, form) => {
                if (!best) {
                    return form;
                }
                if (isMono(form) !== isMono(best)) {
                    return isMono(form) ? form : best;
                }
                return form.stage > best.stage ? form : best;
            }, undefined);
            if (!shown) {
                continue;
            }
            const formKey = getEncounterGroupKey(shown.name);
            const existing = byForm.get(formKey);
            if (existing) {
                if (!existing.locations.includes(slot.locationName)) {
                    existing.locations.push(slot.locationName);
                }
                continue;
            }
            const total = context.data.baseStatTotals[shown.name] ?? 0;
            byForm.set(formKey, {
                speciesKey: species.name,
                formName: shown.name,
                iconName: shown.name,
                // Only a single eligible starter is certain; with several the
                // player takes one of them.
                isStarter:
                    slot.locationName === STARTER_LOCATION_NAME &&
                    slot.kind === 'guaranteed',
                strength:
                    max > min
                        ? Math.min(1, Math.max(0, (total - min) / (max - min)))
                        : 0,
                primaryType: shown.primaryType,
                secondaryType: shown.secondaryType,
                locations: [slot.locationName],
            });
        }
    }
    return [...byForm.values()];
}
