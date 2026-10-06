import { getEncounterGroupKey, pickEncounterSpecies } from './pokemon-species';

export type RandomizerMode = 'weighted' | 'normalized' | 'equal';

export interface EncounterRates {
    morningRate: number;
    dayRate: number;
    eveningRate: number;
    nightRate: number;
}

export interface RandomizableEncounter extends EncounterRates {
    name: string;
}

export interface EncounterOdds {
    pokemonName: string;
    chance: number;
}

/** A row's chance to appear, averaged across the four times of day. */
export function getEffectiveWeight(encounter: EncounterRates): number {
    return (
        (encounter.morningRate +
            encounter.dayRate +
            encounter.eveningRate +
            encounter.nightRate) /
        4
    );
}

/**
 * Every possible roll result with its chance (0-1). Rows with no chance
 * to appear are dropped and rows in the same species group are one entry.
 */
export function getEncounterOdds(
    encounters: readonly RandomizableEncounter[],
    mode: RandomizerMode,
): EncounterOdds[] {
    const groups = groupEncountersByKey(
        encounters.filter((encounter) => getEffectiveWeight(encounter) > 0),
    );
    const weights = RANDOMIZER_MODES[mode].shapeGroupWeights(
        groups.map((group) => getGroupWeight(group, mode)),
    );
    const total = weights.reduce((sum, weight) => sum + weight, 0);
    return groups.map((group, index) => ({
        pokemonName: group.groupKey,
        chance: weights[index] / total,
    }));
}

export function randomizeEncounter(
    encounters: readonly RandomizableEncounter[],
    mode: RandomizerMode,
    random: () => number = Math.random,
): string | undefined {
    const odds = getEncounterOdds(encounters, mode);
    const group = pickWeighted(
        odds,
        odds.map((entry) => entry.chance),
        random,
    );
    return group ? pickEncounterSpecies(group.pokemonName, random) : undefined;
}

interface EncounterGroup<T> {
    groupKey: string;
    members: T[];
}

function groupEncountersByKey<T extends RandomizableEncounter>(
    encounters: readonly T[],
): EncounterGroup<T>[] {
    const groups = new Map<string, T[]>();
    for (const encounter of encounters) {
        const groupKey = getEncounterGroupKey(encounter.name);
        const members = groups.get(groupKey);
        if (members) {
            members.push(encounter);
        } else {
            groups.set(groupKey, [encounter]);
        }
    }
    return [...groups.entries()].map(([groupKey, members]) => ({
        groupKey,
        members,
    }));
}

function getGroupWeight<T extends RandomizableEncounter>(
    group: EncounterGroup<T>,
    mode: RandomizerMode,
): number {
    if (mode === 'weighted') {
        return group.members.reduce(
            (sum, encounter) => sum + getEffectiveWeight(encounter),
            0,
        );
    }
    if (mode === 'equal') {
        return 1;
    }

    const weightsByName = new Map<string, number[]>();
    for (const encounter of group.members) {
        weightsByName.set(encounter.name, [
            ...(weightsByName.get(encounter.name) ?? []),
            getEffectiveWeight(encounter),
        ]);
    }
    return [...weightsByName.values()].reduce(
        (sum, weights) => sum + getDiminishingSum(weights),
        0,
    );
}

/**
 * Rewards extra rows with diminishing returns: each row after the
 * strongest counts at half the multiplier of the one before it, so a
 * species spread across many sub-areas or forms doesn't drown out a
 * species that only has one.
 *
 * Example: 3 rows each weighing 0.5 sum to
 * 0.5*1 + 0.5*0.5 + 0.5*0.25 = 0.875, not the naive 1.5.
 */
function getDiminishingSum(weights: readonly number[]): number {
    return [...weights]
        .sort((a, b) => b - a)
        .reduce((sum, weight, index) => sum + weight * 0.5 ** index, 0);
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
        if (weight < 25) {
            return 25;
        }
        return 50;
    });
}

const RANDOMIZER_MODES: Record<
    RandomizerMode,
    {
        value: RandomizerMode;
        label: string;
        shortLabel: string;
        description: string;
        shapeGroupWeights: WeightShaper;
    }
> = {
    weighted: {
        value: 'weighted',
        label: 'Weighted',
        shortLabel: 'Weighted',
        description: "The randomizer uses the game's encounter rates as-is.",
        shapeGroupWeights: shapeWeighted,
    },
    normalized: {
        value: 'normalized',
        label: 'Normalized',
        shortLabel: 'Normalized',
        description:
            'Rare Pokémon stay rare, but common Pokémon odds are evened out, so no single Pokémon shows up nearly every time. A Pokémon found in several sub-areas gets a small bonus, not a full extra share.',
        shapeGroupWeights: shapeNormalized,
    },
    equal: {
        value: 'equal',
        label: 'Equal chance',
        shortLabel: 'Equal chance',
        description:
            'Every Pokémon that can appear in the area has the same chance, no matter how rare it is in the game.',
        shapeGroupWeights: shapeEqual,
    },
};

export const RANDOMIZER_MODE_OPTIONS: readonly {
    value: RandomizerMode;
    label: string;
    shortLabel: string;
    description: string;
}[] = Object.values(RANDOMIZER_MODES).map(
    ({ value, label, shortLabel, description }) => ({
        value,
        label,
        shortLabel,
        description,
    }),
);

export function toRandomizerMode(value: string): RandomizerMode {
    return value in RANDOMIZER_MODES ? (value as RandomizerMode) : 'normalized';
}

/**
 * Weighted random selection (roulette wheel): each item's chance is its
 * share of the total weight. Callers must only pass items with weight > 0
 * (see the zero-weight filter in `getEncounterOdds`).
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
