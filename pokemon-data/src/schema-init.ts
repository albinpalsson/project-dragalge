import { rm } from 'node:fs/promises';
import type { DB } from '@pokedb2/db';
import type { Database, DbClient } from '@pokedb2/query-builder';
import type { PokemonDataDb } from './schema.ts';
import type { LocationSeed } from './sources/fetch-location-seeds.ts';

export const PROVISIONAL_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE pokemon (id INT, name CHAR(64), primary_type CHAR(24), secondary_type CHAR(24), base_hp TINYINT, base_attack TINYINT, base_defense TINYINT, base_sp_attack TINYINT, base_sp_defense TINYINT, base_speed TINYINT)',
    'CREATE TABLE evolution_methods (id TINYINT, description CHAR(64))',
    'CREATE TABLE evolution_transitions (from_pokemon_id INT, to_pokemon_id INT, method_id TINYINT)',
    'CREATE TABLE locations (id CHAR(32), name CHAR(27), region CHAR(6), province CHAR(14))',
    'CREATE TABLE abilities (id TINYINT, name CHAR(24), description CHAR(160))',
    'CREATE TABLE boss_battles (id TINYINT, name CHAR(44), battle_type CHAR(8))',
    'CREATE TABLE boss_battle_pokemon (boss_battle_id TINYINT, pokemon_id INT, level TINYINT, ability_id TINYINT),'
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
    return `CREATE TABLE ${tableName} (id INT, sub_area CHAR(10), pokemon_id INT, games CHAR(3), terrain CHAR(29), min_level TINYINT, max_level TINYINT, morning_rate TINYINT, day_rate TINYINT, evening_rate TINYINT, night_rate TINYINT)`;
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

export function buildPokemonIdMap(
    locations: readonly LocationSeed[],
): Map<string, number> {
    const ids = new Map<string, number>();
    for (const location of locations) {
        for (const encounter of location.encounters) {
            if (!ids.has(encounter.pokemonName)) {
                ids.set(encounter.pokemonName, ids.size + 1);
            }
        }
    }
    return ids;
}

export async function insertLocationEncounters(
    db: Database<PokemonDataDb>,
    locations: readonly LocationSeed[],
    pokemonIds: Map<string, number>,
): Promise<void> {
    for (const location of locations) {
        const rows = location.encounters.map((encounter, index) => ({
            id: index + 1,
            sub_area: encounter.subArea,
            pokemon_id: pokemonIds.get(encounter.pokemonName)!,
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
