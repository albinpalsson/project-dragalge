import { getPokemonDb } from './client';
import type { LocationRow, PokemonDataDb } from '@pokedb2/pokemon-data';

export interface PokemonNameDto {
    name: string;
}

export interface LocationEncounterDetails {
    location: LocationRow;
    encounters: LocationEncounterView[];
}

export interface LocationEncounterView {
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

export interface PokemonBaseStats {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

export interface PokemonView {
    name: string;
    primaryType: string;
    // Empty when the Pokémon is single-typed; the seed data stores type id 0 for "none".
    secondaryType: string;
    baseStats: PokemonBaseStats;
}

export async function getPokemon(
    name: string,
): Promise<PokemonView | undefined> {
    const db = await getPokemonDb();
    const row = await db
        .selectFrom('pokemon')
        .selectAll()
        .where('name', '=', name)
        .executeTakeFirst();

    if (!row) {
        return undefined;
    }

    const types = await db.selectFrom('pokemon_types').selectAll().execute();
    const typeById = new Map(types.map((type) => [type.id, type.name]));

    return {
        name: row.name,
        primaryType: typeById.get(row.primary_type_id) ?? '',
        secondaryType: typeById.get(row.secondary_type_id) ?? '',
        baseStats: {
            hp: row.base_hp,
            attack: row.base_attack,
            defense: row.base_defense,
            specialAttack: row.base_sp_attack,
            specialDefense: row.base_sp_defense,
            speed: row.base_speed,
        },
    };
}

export async function getLocationEncounterDetails(
    locationName: string,
): Promise<LocationEncounterDetails> {
    const db = await getPokemonDb();
    const location = await db
        .selectFrom('locations')
        .selectAll()
        .where('name', '=', locationName)
        .executeTakeFirst();

    if (!location) {
        throw new Error(`Unknown location: ${locationName}`);
    }
    const encounterTable = location.id as keyof PokemonDataDb & string;

    const [rows, subAreas, terrains] = await Promise.all([
        db
            .selectFrom(encounterTable)
            .innerJoin('pokemon', `${encounterTable}.pokemon_id`, 'pokemon.id')
            .selectAll()
            .execute(),
        db.selectFrom('sub_areas').selectAll().execute(),
        db.selectFrom('terrain_types').selectAll().execute(),
    ]);
    const subAreaById = new Map(
        subAreas.map((subArea) => [subArea.id, subArea.name]),
    );
    const terrainById = new Map(
        terrains.map((terrain) => [terrain.id, terrain.key]),
    );

    return {
        location,
        encounters: rows.flatMap((row) => {
            return [
                {
                    name: row.name,
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
