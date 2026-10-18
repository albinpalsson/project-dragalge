import type { LocationEncounterView } from '../db/pokemon-data/queries';

export function isEncounterInVariant(games: string, variant: string): boolean {
    return games.toLowerCase().includes(variant.toLowerCase());
}

export function variantDisplayName(variant: string): string {
    return variant.toLowerCase() === 'v' ? 'Pokemon Violet' : 'Pokemon Scarlet';
}

export function filterEncountersForVariant(
    encounters: LocationEncounterView[],
    variant: string,
): LocationEncounterView[] {
    return encounters.filter((encounter) =>
        isEncounterInVariant(encounter.games, variant),
    );
}
