export type RandomizerMode = 'weighted' | 'normalized' | 'equal';

export interface RandomizableEncounter {
    groupKey: string;
    morningRate: number;
    dayRate: number;
    eveningRate: number;
    nightRate: number;
}

/** A row's chance to appear, averaged across the four times of day. */
export function getEffectiveWeight(encounter: RandomizableEncounter): number {
    return (
        (encounter.morningRate +
            encounter.dayRate +
            encounter.eveningRate +
            encounter.nightRate) /
        4
    );
}

/**
 * Rolls one species-group from a location's active encounter list. Rows
 * with no chance to appear (see `getEffectiveWeight`) are dropped first,
 * so every mode only ever has to weigh eligible rows.
 *
 * This only picks the group (species) — if it has multiple forms or
 * sub-areas (merged via `groupKey`, see `randomizer-groups.ts`), the
 * caller lets the player choose which exact one to catch.
 */
export function randomizeEncounter<T extends RandomizableEncounter>(
    encounters: readonly T[],
    mode: RandomizerMode,
    random: () => number = Math.random,
): EncounterGroup<T> | undefined {
    const eligible = encounters.filter(
        (encounter) => getEffectiveWeight(encounter) > 0,
    );
    const groups = groupEncountersByKey(eligible);
    const shapedWeights = RANDOMIZER_MODES[mode].shapeGroupWeights(
        groups.map(getGroupWeight),
    );
    return pickWeighted(groups, shapedWeights, random);
}

export interface EncounterGroup<T> {
    groupKey: string;
    members: T[];
}

/**
 * Collapses encounter rows into one entry per species/merge-group, so a
 * Pokemon with several rows is rolled as a single option.
 *
 * Example:
 *   Input:  [Basculin@Prairie, Basculin (Red-Striped)@Lake, Fletchling@Prairie]
 *   Output: [{ groupKey: 'basculin', members: [...2 rows] },
 *            { groupKey: 'fletchling', members: [...1 row] }]
 */
function groupEncountersByKey<T extends RandomizableEncounter>(
    encounters: readonly T[],
): EncounterGroup<T>[] {
    const groups = new Map<string, T[]>();
    for (const encounter of encounters) {
        const members = groups.get(encounter.groupKey);
        if (members) {
            members.push(encounter);
        } else {
            groups.set(encounter.groupKey, [encounter]);
        }
    }
    return [...groups.entries()].map(([groupKey, members]) => ({
        groupKey,
        members,
    }));
}

/**
 * A group's weight rewards extra members, but with diminishing returns:
 * each row after the strongest counts at half the multiplier of the one
 * before it, so a species spread across many sub-areas doesn't drown out
 * a species that only has one.
 *
 * Example: a group of 3 rows each weighing 0.5 sums to
 * 0.5*1 + 0.5*0.5 + 0.5*0.25 = 0.875, not the naive 1.5.
 */
function getGroupWeight<T extends RandomizableEncounter>(
    group: EncounterGroup<T>,
): number {
    const weights = group.members
        .map(getEffectiveWeight)
        .sort((a, b) => b - a);
    return weights.reduce(
        (sum, weight, index) => sum + weight * 0.5 ** index,
        0,
    );
}

type WeightShaper = (groupWeights: readonly number[]) => number[];

/** Realistic: use the game's own encounter rates as-is. */
function shapeWeighted(groupWeights: readonly number[]): number[] {
    return [...groupWeights];
}

/** Every remaining species is equally likely (zero-weight rows are already filtered out). */
function shapeEqual(groupWeights: readonly number[]): number[] {
    return groupWeights.map(() => 1);
}

/**
 * Keeps genuinely rare species rare, but flattens common species into two
 * tiers so no single very-common species dominates every roll.
 */
function shapeNormalized(groupWeights: readonly number[]): number[] {
    return groupWeights.map((weight) => {
        if (weight < 5) {
            return weight;
        }
        if (weight < 20) {
            return 25;
        }
        return 50;
    });
}

const RANDOMIZER_MODES: Record<
    RandomizerMode,
    { value: RandomizerMode; label: string; shapeGroupWeights: WeightShaper }
> = {
    weighted: {
        value: 'weighted',
        label: 'Weighted (realistic)',
        shapeGroupWeights: shapeWeighted,
    },
    normalized: {
        value: 'normalized',
        label: 'Normalized (flattened)',
        shapeGroupWeights: shapeNormalized,
    },
    equal: {
        value: 'equal',
        label: 'Equal chance',
        shapeGroupWeights: shapeEqual,
    },
};

export const DEFAULT_RANDOMIZER_MODE: RandomizerMode = 'normalized';

export const RANDOMIZER_MODE_OPTIONS: readonly {
    value: RandomizerMode;
    label: string;
}[] = Object.values(RANDOMIZER_MODES).map(({ value, label }) => ({
    value,
    label,
}));

export function toRandomizerMode(value: string): RandomizerMode {
    return value in RANDOMIZER_MODES
        ? (value as RandomizerMode)
        : DEFAULT_RANDOMIZER_MODE;
}

/**
 * Weighted random selection (roulette wheel): each item's chance is its
 * share of the total weight. Callers must only pass items with weight > 0
 * (see the zero-weight filter in `randomizeEncounter`).
 */
function pickWeighted<T>(
    items: readonly T[],
    weights: readonly number[],
    random: () => number,
): T | undefined {
    if (items.length === 0) {
        return undefined;
    }
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = random() * total;
    for (let index = 0; index < items.length; index++) {
        roll -= weights[index];
        if (roll <= 0) {
            return items[index];
        }
    }
    return items[items.length - 1];
}
