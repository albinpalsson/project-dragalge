import { getPokemonDb } from './client';
import type {
    LocationEncounterRow,
    LocationRow,
    PokemonDataDb,
    PokemonRow,
} from '@pokedb2/pokemon-data';

export const STARTER_NAMES = ['Sprigatito', 'Fuecoco', 'Quaxly'] as const;

export interface LocationEncounterDetails {
    location: LocationRow;
    encounters: LocationEncounterView[];
}

export interface LocationEncounterView {
    pokemonId: number;
    name: string;
    subArea: string;
    games: string;
    terrain: string;
    minLevel: number;
    maxLevel: number;
    morningRate: number;
    dayRate: number;
    eveningRate: number;
    nightRate: number;
}

export async function listStarters() {
    return (await getPokemonDb())
        .selectFrom('pokemon')
        .selectAll()
        .where('name', 'in', STARTER_NAMES)
        .execute();
}

export async function getPokemonById(
    id: number,
) {
    return (await getPokemonDb())
        .selectFrom('pokemon')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
}

export async function listPokemonByIds(ids: readonly number[]) {
    if (ids.length === 0) {
        return [];
    }

    return (await getPokemonDb())
        .selectFrom('pokemon')
        .selectAll()
        .where('id', 'in', ids)
        .execute();
}

export async function getLocationEncounterDetails(
    locationId: string,
): Promise<LocationEncounterDetails> {
    const db = await getPokemonDb();
    const location = await db
        .selectFrom('locations')
        .selectAll()
        .where('id', '=', locationId)
        .executeTakeFirst();

    if (!location) {
        throw new Error(`Unknown location: ${locationId}`);
    }

    const rows = (await db
        .selectFrom(locationId as keyof PokemonDataDb & string)
        .selectAll()
        .execute()) as LocationEncounterRow[];
    const [pokemonRows, subAreas, terrains] = await Promise.all([
        listPokemonByIds(unique(rows.map((row) => row.pokemon_id))),
        db.selectFrom('sub_areas').selectAll().execute(),
        db.selectFrom('terrain_types').selectAll().execute(),
    ]);
    const pokemonById = new Map(
        (pokemonRows as PokemonRow[]).map((pokemon) => [pokemon.id, pokemon]),
    );
    const subAreaById = new Map(
        subAreas.map((subArea) => [subArea.id, subArea.name]),
    );
    const terrainById = new Map(
        terrains.map((terrain) => [terrain.id, terrain.key]),
    );

    return {
        location,
        encounters: rows.flatMap((row) => {
            const pokemon = pokemonById.get(row.pokemon_id);
            if (!pokemon) {
                return [];
            }
            return [
                {
                    pokemonId: row.pokemon_id,
                    name: pokemon.name,
                    subArea: subAreaById.get(row.sub_area_id) ?? 'Unknown',
                    games: row.games,
                    terrain: terrainById.get(row.terrain_id) ?? 'unknown',
                    minLevel: row.min_level,
                    maxLevel: row.max_level,
                    morningRate: row.morning_rate,
                    dayRate: row.day_rate,
                    eveningRate: row.evening_rate,
                    nightRate: row.night_rate,
                },
            ];
        }),
    };
}

function unique<T>(values: readonly T[]): T[] {
    return [...new Set(values)];
}
