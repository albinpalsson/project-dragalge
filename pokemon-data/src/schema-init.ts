import { rm } from 'node:fs/promises';
import type { DB } from '@pokedb2/db';
import type { Database, DbClient } from '@pokedb2/query-builder';
import type { PokemonDataDb } from './schema.ts';
import type { LocationSeed } from './sources/fetch-location-seeds.ts';

export const PROVISIONAL_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE pokemon (id INT, name CHAR(64), primary_type CHAR(24), secondary_type CHAR(24), base_hp INT, base_attack INT, base_defense INT, base_sp_attack INT, base_sp_defense INT, base_speed INT)',
    'CREATE TABLE evolution_links (id INT, from_pokemon_id INT, to_pokemon_id INT, direction CHAR(16), notes CHAR(96))',
    'CREATE TABLE locations (id INT, name CHAR(96), region CHAR(64), province CHAR(64))',
    'CREATE TABLE boss_battles (id INT, name CHAR(96), battle_type CHAR(24))',
    'CREATE TABLE boss_battle_pokemon (id INT, boss_battle_id INT, pokemon_id INT, slot_order INT)',
];

export function applyProvisionalSchema(db: DB): void {
    for (const sql of PROVISIONAL_SCHEMA_SQL) {
        db.execute(sql, []);
    }
}

export async function initializeDb(
    dbPath: string,
    client: DbClient,
    locations: readonly LocationSeed[],
) {
    await rm(dbPath, { force: true });
    for (const sql of PROVISIONAL_SCHEMA_SQL) {
        await client.execute(sql, []);
    }

    for (const location of locations) {
        await client.execute(createEncounterTableSql(location.slug), []);
    }
}

function createEncounterTableSql(tableName: string): string {
    return `CREATE TABLE ${tableName} (id INT, location_id INT, sub_area CHAR(96), pokemon_name CHAR(64), games CHAR(32), terrain CHAR(64), min_level INT, max_level INT, morning_rate INT, day_rate INT, evening_rate INT, night_rate INT)`;
}

export function buildLocationIdMap(
    locations: readonly LocationSeed[],
): Map<string, number> {
    const ids = new Map<string, number>();
    locations.forEach((location, index) => {
        ids.set(location.slug, index + 1);
    });
    return ids;
}

export async function insertLocationEncounters(
    db: Database<PokemonDataDb>,
    locations: readonly LocationSeed[],
): Promise<void> {
    for (const location of locations) {
        const rows = location.encounters.map((encounter, index) => ({
            id: index + 1,
            sub_area: encounter.subArea,
            pokemon_name: encounter.pokemonName,
            games: encounter.games.join(','),
            terrain: encounter.terrain.join(','),
            min_level: encounter.minLevel,
            max_level: encounter.maxLevel,
            morning_rate: encounter.morningRate,
            day_rate: encounter.dayRate,
            evening_rate: encounter.eveningRate,
            night_rate: encounter.nightRate,
        }));

        if (rows.length === 0) {
            continue;
        }

        await db.insertInto(location.slug).values(rows).execute();
    }
}
