import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { getEffectiveWeight } from '../randomizer';

const LEVEL_RANGE_TAIL = 0.025;
const LEVEL_RANGE_EPSILON = 1e-12;

interface EncounterGroupLevelRange {
    min: number;
    max: number;
    trimmedMin: number;
    trimmedMax: number;
}

export function formatLevelRange(encounter: LocationEncounterView): string {
    return formatLevelBounds(encounter.minLevel, encounter.maxLevel);
}

export function formatLevelBounds(min: number, max: number): string {
    return min === max ? String(min) : `${min}-${max}`;
}

export function formatWeight(encounter: LocationEncounterView): string {
    const weight = getEffectiveWeight(encounter);
    return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

export function formatRareWeight(
    encounter: LocationEncounterView,
): string | undefined {
    const weight = getEffectiveWeight(encounter);
    if (weight >= 10) {
        return undefined;
    }
    return `rare (${Number.isInteger(weight) ? weight : weight.toFixed(1)}%)`;
}

export function formatTerrain(terrainKey: string): string {
    return terrainKey
        .split(',')
        .map((part) => part.trim())
        .filter((part) => part.length > 0)
        .map((part) =>
            part
                .split('_')
                .map((word) =>
                    word.length > 0
                        ? `${word[0].toUpperCase()}${word.slice(1)}`
                        : word,
                )
                .join(' '),
        )
        .join('/');
}

export function formatSubAreaTerrain(
    pairs: { subArea: string; terrain: string }[],
): string {
    return pairs
        .map(({ subArea, terrain }) => `${subArea} (${formatTerrain(terrain)})`)
        .join(' or ');
}

export function formatTime(encounter: LocationEncounterView): string {
    const times = [
        ['morning', encounter.morningRate],
        ['day', encounter.dayRate],
        ['evening', encounter.eveningRate],
        ['night', encounter.nightRate],
    ]
        .filter(([, rate]) => Number(rate) > 0)
        .map(([time]) => time);
    return times.length === 4 ? 'All' : times.join('/');
}

export function formatGames(games: string): string {
    return games.toUpperCase().split('').join('/');
}

export function formatEncounterGroupLevelRange(
    encounters: LocationEncounterView[],
): string | undefined {
    const range = getEncounterGroupLevelRange(encounters);
    return range
        ? formatLevelBounds(range.trimmedMin, range.trimmedMax)
        : undefined;
}

function getEncounterGroupLevelRange(
    encounters: LocationEncounterView[],
): EncounterGroupLevelRange | undefined {
    if (encounters.length === 0) {
        return undefined;
    }
    const min = Math.min(...encounters.map((encounter) => encounter.minLevel));
    const max = Math.max(...encounters.map((encounter) => encounter.maxLevel));
    const levelProbabilities = new Array<number>(max - min + 1).fill(0);

    for (const encounter of encounters) {
        const levelCount = encounter.maxLevel - encounter.minLevel + 1;
        const probabilityPerLevel = 1 / (encounters.length * levelCount);
        for (
            let level = encounter.minLevel;
            level <= encounter.maxLevel;
            level++
        ) {
            levelProbabilities[level - min] += probabilityPerLevel;
        }
    }

    let cumulativeProbability = 0;
    let trimmedMin = min;
    let trimmedMax = max;
    let foundMin = false;

    for (let index = 0; index < levelProbabilities.length; index++) {
        cumulativeProbability += levelProbabilities[index];
        if (
            !foundMin &&
            cumulativeProbability + LEVEL_RANGE_EPSILON >= LEVEL_RANGE_TAIL
        ) {
            trimmedMin = min + index;
            foundMin = true;
        }
        if (
            cumulativeProbability + LEVEL_RANGE_EPSILON >=
            1 - LEVEL_RANGE_TAIL
        ) {
            trimmedMax = min + index;
            break;
        }
    }

    return { min, max, trimmedMin, trimmedMax };
}
