import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import type { LocationEncounterView } from '../../db/pokemon-data/queries';
import { getEncounterGroupKey } from '../../pokemon-species';
import { getEffectiveWeight, getEncounterOdds } from '../../randomizer';
import {
    BAN_REASON,
    buildSpeciesBans,
    toSpeciesName,
} from '../../utils/ban-list';
import { filterEncountersForVariant } from '../../utils/game-variant';
import { STARTER_NAMES } from '../../utils/starter-choices';
import type {
    LocationOutcome,
    LocationStep,
    PlanContext,
    PlanState,
    PoolSpecies,
    RemovedSpecies,
    StageTrace,
} from './plan-types';

export function planStarter(
    context: PlanContext,
    state: PlanState,
    key: string,
): LocationStep {
    // The game picks the starter ignoring mono rules and releases it when it
    // does not fit, so only an eligible starter counts as an encounter.
    const eligible = STARTER_NAMES.filter((name) =>
        context.monoEligible.has(name),
    );
    const pool = eligible.map((name) =>
        toPoolSpecies(context, name, [name], 1 / eligible.length),
    );
    const step: LocationStep = {
        kind: 'location',
        key,
        locationName: STARTER_LOCATION_NAME,
        outcome: getOutcome(pool),
        stages: [
            {
                label: 'Starter choices',
                speciesCount: STARTER_NAMES.length,
                names: [...STARTER_NAMES],
                removed: [],
            },
            {
                label: 'Mono eligible',
                speciesCount: eligible.length,
                names: eligible,
                removed: STARTER_NAMES.filter(
                    (name) => !context.monoEligible.has(name),
                ).map((name) => ({
                    name,
                    reason: `${BAN_REASON.MonoRun} (the starter would be released)`,
                })),
            },
        ],
        pool,
        note:
            pool.length === 0
                ? 'No starter fits the type, so it is released and gives no encounter.'
                : undefined,
        activeGuaranteedBans: [],
    };
    commitLocation(state, step, pool);
    return step;
}

export function planLocation(
    context: PlanContext,
    state: PlanState,
    key: string,
    locationName: string,
): LocationStep {
    const { inputs, data } = context;
    const allRows = data.locationEncounters.get(locationName) ?? [];
    const speciesBans = buildSpeciesBans({
        // The planner has no ban list, only the dupes clause.
        manualBanNames: [],
        banFullEvolutionLines: false,
        dupesClauseEnabled: inputs.dupesClause,
        usedEncounterNames: state.guaranteedPokemonNames,
        getEvolutionFamily: data.evolutionGraph.getEvolutionFamily,
    });

    const versionRows = filterEncountersForVariant(allRows, inputs.variant);
    const oceanRows = filterOcean(locationName, versionRows);
    const chanceRows = oceanRows.filter((row) => getEffectiveWeight(row) > 0);
    const unbannedRows = chanceRows.filter(
        (row) => !speciesBans.has(toSpeciesName(row.name)),
    );
    const monoRows = unbannedRows.filter((row) =>
        context.monoEligible.has(row.name),
    );

    const stages = [
        traceStage('All rows', [], allRows),
        traceStage('Version', allRows, versionRows, () => 'Other version'),
        traceStage(
            'Ocean filter',
            versionRows,
            oceanRows,
            () => 'Ocean/underwater filter',
        ),
        traceStage(
            'Has encounter chance',
            oceanRows,
            chanceRows,
            () => 'No encounter chance',
        ),
        traceStage(
            'Bans',
            chanceRows,
            unbannedRows,
            (row) => speciesBans.get(toSpeciesName(row.name)) ?? 'Banned',
        ),
        traceStage(
            'Mono eligible',
            unbannedRows,
            monoRows,
            () => BAN_REASON.MonoRun,
        ),
    ];

    const pool = getEncounterOdds(monoRows, 'normalized').map((odds) =>
        toPoolSpecies(
            context,
            odds.pokemonName,
            [
                ...new Set(
                    monoRows
                        .filter(
                            (row) =>
                                getEncounterGroupKey(row.name) ===
                                odds.pokemonName,
                        )
                        .map((row) => row.name),
                ),
            ],
            odds.chance,
        ),
    );
    const outcome = getOutcome(pool);
    const speciesBeforeBans = stages[3].speciesCount;

    let note: string | undefined;
    if (outcome === 'skipped') {
        note =
            speciesBeforeBans === 0
                ? 'Nothing can be encountered here with these filters.'
                : 'Every species here is banned or not allowed in the mono run.';
    } else if (outcome === 'guaranteed' && speciesBeforeBans > 1) {
        note = `Only ${pool[0].name} is left, out of ${speciesBeforeBans} species before bans and the mono filter.`;
    } else if (outcome === 'guaranteed') {
        note = `${pool[0].name} is the only species here.`;
    }

    const step: LocationStep = {
        kind: 'location',
        key,
        locationName,
        outcome,
        stages,
        pool,
        note,
        activeGuaranteedBans: inputs.dupesClause
            ? [...state.guaranteedSpecies]
            : [],
    };
    commitLocation(state, step, pool);
    return step;
}

function getOutcome(pool: readonly PoolSpecies[]): LocationOutcome {
    if (pool.length === 0) {
        return 'skipped';
    }
    return pool.length === 1 ? 'guaranteed' : 'optional';
}

/**
 * A single-species location is a guaranteed catch, so it counts as caught for
 * the dupes clause at every following location.
 */
function commitLocation(
    state: PlanState,
    step: LocationStep,
    pool: PoolSpecies[],
): void {
    if (step.outcome === 'skipped') {
        return;
    }
    state.slots.push({
        locationName: step.locationName,
        kind: step.outcome,
        pool,
    });
    if (step.outcome === 'guaranteed') {
        state.guaranteedPokemonNames.push(pool[0].memberNames[0]);
        state.guaranteedSpecies.push(pool[0].name);
    }
}

function toPoolSpecies(
    context: PlanContext,
    name: string,
    memberNames: string[],
    chance: number,
): PoolSpecies {
    const entry = context.typesByName.get(memberNames[0]);
    return {
        name,
        memberNames,
        primaryType: entry?.primaryType ?? '',
        secondaryType: entry?.secondaryType ?? '',
        chance,
    };
}

function traceStage(
    label: string,
    previousRows: readonly LocationEncounterView[],
    rows: readonly LocationEncounterView[],
    getReason: (row: LocationEncounterView) => string = () => '',
): StageTrace {
    const names = uniqueGroupKeys(rows);
    const kept = new Set(names);
    const removed: RemovedSpecies[] = [];
    for (const groupKey of uniqueGroupKeys(previousRows)) {
        if (!kept.has(groupKey)) {
            const row = previousRows.find(
                (candidate) =>
                    getEncounterGroupKey(candidate.name) === groupKey,
            );
            removed.push({
                name: groupKey,
                reason: row ? getReason(row) : '',
            });
        }
    }
    return { label, speciesCount: names.length, names, removed };
}

function uniqueGroupKeys(rows: readonly LocationEncounterView[]): string[] {
    return [...new Set(rows.map((row) => getEncounterGroupKey(row.name)))];
}

/**
 * Copies of the per-location ocean toggles in the encounter cards
 * (PocoPath, SouthProvinceAreaOne, SouthProvinceAreaFour, WestProvinceAreaOne).
 * All of them hide these encounters by default, and the planner always uses
 * that default.
 */
function filterOcean(
    locationName: string,
    rows: LocationEncounterView[],
): LocationEncounterView[] {
    switch (locationName) {
        case 'Poco Path':
            return rows.filter(
                (row) => !['Ocean', 'Beach'].includes(row.subArea),
            );
        case 'South Province (Area One)':
        case 'South Province (Area Four)':
            return rows.filter(
                (row) =>
                    row.subArea !== 'Ocean' && row.terrain !== 'underwater',
            );
        case 'West Province (Area One)':
            return rows.filter((row) => row.subArea !== 'Ocean');
        default:
            return rows;
    }
}
