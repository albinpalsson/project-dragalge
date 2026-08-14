import { rm } from 'node:fs/promises';
import type { DB } from '@pokedb2/db';
import type { Database, DbClient } from '@pokedb2/query-builder';
import type { PokemonDataDb } from './schema.ts';
import type { LocationSeed } from './sources/fetch-location-seeds.ts';
import { fetchPokemonData, type PokemonData } from './fetch/fetch-pokemon-data.ts';

export const PROVISIONAL_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE pokemon (id INT, name CHAR(32), primary_type_id TINYINT, secondary_type_id TINYINT, base_hp TINYINT, base_attack TINYINT, base_defense TINYINT, base_sp_attack TINYINT, base_sp_defense TINYINT, base_speed TINYINT)',
    'CREATE TABLE pokemon_types (id TINYINT, name CHAR(12))',
    'CREATE TABLE sub_areas (id TINYINT, name CHAR(16))',
    'CREATE TABLE terrain_types (id TINYINT, key CHAR(29))',
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
    return `CREATE TABLE ${tableName} (id INT, sub_area_id TINYINT, pokemon_id INT, games CHAR(2), terrain_id TINYINT, min_level TINYINT, max_level TINYINT, morning_rate TINYINT, day_rate TINYINT, evening_rate TINYINT, night_rate TINYINT)`;
}

function canonicalTerrainKey(values: readonly string[]): string {
    return [...values].sort().join(',');
}

function canonicalGameValue(values: readonly string[]): 's' | 'v' | 'sv' {
    const lower = new Set(values.map((value) => value.trim().toLowerCase()));
    const hasCombined = lower.has('sv') || lower.has('s,v') || lower.has('v,s');
    const hasS = hasCombined || lower.has('s');
    const hasV = hasCombined || lower.has('v');
    if (hasS && hasV) {
        return 'sv';
    }
    if (hasS) {
        return 's';
    }
    if (hasV) {
        return 'v';
    }
    throw new Error(`Unexpected games value: ${values.join(',')}`);
}

export interface PokemonRowWithTypeIds extends Omit<PokemonData, 'primary_type' | 'secondary_type'> {
    id: number;
    primary_type_id: number;
    secondary_type_id: number;
}

export function buildTypeRowsAndPokemonRows(
    pokemonRows: readonly (PokemonData & { id: number })[],
) {
    const typeIds = new Map<string, number>();
    const typeRows: { id: number; name: string }[] = [];

    const resolveTypeId = (typeName: string): number => {
        const normalized = typeName.trim().toLowerCase();
        if (normalized.length === 0) {
            return 0;
        }
        const existing = typeIds.get(normalized);
        if (existing !== undefined) {
            return existing;
        }
        const id = typeRows.length + 1;
        typeIds.set(normalized, id);
        typeRows.push({ id, name: normalized });
        return id;
    };

    const mappedPokemonRows: PokemonRowWithTypeIds[] = pokemonRows.map((row) => ({
        ...row,
        primary_type_id: resolveTypeId(row.primary_type),
        secondary_type_id: resolveTypeId(row.secondary_type),
    }));

    return { typeRows, mappedPokemonRows };
}

export function buildTerrainRows(
    locations: readonly LocationSeed[],
): {
    terrainRows: { id: number; key: string }[];
    terrainIds: Map<string, number>;
} {
    const terrainIds = new Map<string, number>();
    const terrainRows: { id: number; key: string }[] = [];
    for (const location of locations) {
        for (const encounter of location.encounters) {
            const key = canonicalTerrainKey(encounter.terrain);
            if (terrainIds.has(key)) {
                continue;
            }
            const id = terrainRows.length + 1;
            terrainIds.set(key, id);
            terrainRows.push({ id, key });
        }
    }
    return { terrainRows, terrainIds };
}

export function buildSubAreaRows(
    locations: readonly LocationSeed[],
): {
    subAreaRows: { id: number; name: string }[];
    subAreaIds: Map<string, number>;
} {
    const subAreaIds = new Map<string, number>();
    const subAreaRows: { id: number; name: string }[] = [];
    for (const location of locations) {
        for (const encounter of location.encounters) {
            const name = encounter.subArea.trim();
            if (subAreaIds.has(name)) {
                continue;
            }
            const id = subAreaRows.length + 1;
            subAreaIds.set(name, id);
            subAreaRows.push({ id, name });
        }
    }
    return { subAreaRows, subAreaIds };
}


export async function fetchAllPokemonRows(
    pokemonIds: Map<string, number>,
): Promise<(PokemonData & { id: number })[]> {

    const buildReturnEntry = async ([name, id]: [string, number]) => ({
        id,
        ...(await fetchPokemonData(name)),
    });
    const promises = await Promise.allSettled([...pokemonIds.entries()].map(buildReturnEntry));

    const result: (PokemonData & { id: number })[] = []
    let failed = false;
    for (const r of promises) {
        if (r.status === 'fulfilled') {
            result.push(r.value);
        }
        if (r.status === 'rejected') {
            failed = true;
            process.stderr.write(`${r.reason instanceof Error ? r.reason.message : String(r.reason)}\n`);
        }
    }
    if (failed) {
        throw new Error(`Some pokemon failed to fetch/parse`);
    }
    return result;
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
    subAreaIds: Map<string, number>,
    terrainIds: Map<string, number>,
): Promise<void> {
    for (const location of locations) {
        const rows = location.encounters.map((encounter, index) => ({
            id: index + 1,
            sub_area_id: subAreaIds.get(encounter.subArea.trim())!,
            pokemon_id: pokemonIds.get(encounter.pokemonName)!,
            games: canonicalGameValue(encounter.games),
            terrain_id: terrainIds.get(canonicalTerrainKey(encounter.terrain))!,
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
