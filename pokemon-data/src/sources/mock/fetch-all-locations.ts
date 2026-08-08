import type { LocationEncounterRow, LocationRow } from '../../schema.ts';

export interface LocationSourceResult {
    locations: LocationRow[];
    encounters: LocationEncounterRow[];
}

export async function fetchAllLocations(): Promise<LocationSourceResult> {
    const locations: LocationRow[] = [
        { id: 1, name: 'South Province (Area One)', region: 'South Province' },
        { id: 2, name: 'Cabo Poco', region: 'South Province' },
    ];

    const encounters: LocationEncounterRow[] = [
        {
            id: 1,
            location_id: 1,
            pokemon_id: 1,
            encounter_rate: 'common',
            sub_region: 'grass patches near roads',
        },
        {
            id: 2,
            location_id: 1,
            pokemon_id: 4,
            encounter_rate: 'rare',
            sub_region: 'open hills',
        },
        {
            id: 3,
            location_id: 2,
            pokemon_id: 7,
            encounter_rate: 'common',
            sub_region: 'coastline',
        },
    ];

    return { locations, encounters };
}
