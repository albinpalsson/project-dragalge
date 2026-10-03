import locationsData from './locations.ts';

export interface LocationEncounterSeed {
    subArea: string;
    pokemonName: string;
    games: string[];
    terrain: string[];
    minLevel: number;
    maxLevel: number;
    morningRate: number;
    dayRate: number;
    eveningRate: number;
    nightRate: number;
}

export interface LocationSeed {
    slug: string;
    name: string;
    region: string;
    province: string;
    encounters: LocationEncounterSeed[];
}

export async function fetchLocationSeeds() {
    const parsed = locationsData;
    const locations: LocationSeed[] = [];

    for (const location of parsed) {
        const locationEncounters: LocationEncounterSeed[] = [];

        for (const subArea of location.subAreas) {
            for (const encounter of subArea.encounters) {
                locationEncounters.push({
                    subArea: encounter.subArea,
                    pokemonName: encounter.pokemon,
                    games: encounter.games,
                    terrain: Array.isArray(encounter.terrain)
                        ? encounter.terrain
                        : [encounter.terrain],
                    minLevel: encounter.levels.min,
                    maxLevel: encounter.levels.max,
                    morningRate: encounter.probabilityByTime.morning,
                    dayRate: encounter.probabilityByTime.day,
                    eveningRate: encounter.probabilityByTime.evening,
                    nightRate: encounter.probabilityByTime.night,
                });
            }
        }

        locations.push({
            slug: location.id,
            name: location.name,
            region: location.region,
            province: location.province,
            encounters: locationEncounters,
        });
    }

    return { locations };
}
