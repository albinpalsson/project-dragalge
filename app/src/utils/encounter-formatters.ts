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
