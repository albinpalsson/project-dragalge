import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { getEffectiveWeight } from '../randomizer';

export function formatLevelRange(encounter: LocationEncounterView): string {
    if (encounter.minLevel === encounter.maxLevel) {
        return String(encounter.minLevel);
    }
    return `${encounter.minLevel}-${encounter.maxLevel}`;
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
    if (encounters.length === 0) {
        return undefined;
    }
    const min = Math.min(...encounters.map((encounter) => encounter.minLevel));
    const max = Math.max(...encounters.map((encounter) => encounter.maxLevel));
    return `${min}-${max}`;
}
