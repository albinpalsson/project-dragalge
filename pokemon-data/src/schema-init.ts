import { rm } from 'node:fs/promises';
import type { DB } from '@pokedb2/db';
import type { Database, DbClient } from '@pokedb2/query-builder';
import { toCanonicalPokemonName } from './pokemon-names.ts';
import { fetchAbilityData } from './fetch/fetch-ability-data.ts';
import { fetchMoveData } from './fetch/fetch-move-data.ts';
import {
    fetchPokemonData,
    type PokemonData,
} from './fetch/fetch-pokemon-data.ts';
import { consolidateEvolutionEdges } from './fetch/bulbapedia-parser.ts';
import {
    fetchTrainerParty,
    type TrainerPartyEntry,
} from './fetch/fetch-trainer-party.ts';
import type {
    AbilityRow,
    BossBattlePokemonMoveRow,
    BossBattlePokemonRow,
    MoveRow,
    PokemonDataDb,
    TypeEffectivenessRow,
} from './schema.ts';
import { TYPE_EFFECTIVENESS_MATRIX } from './type-effectiveness.ts';
import type { BossFightSeed } from './sources/fetch-boss-fight-seeds.ts';
import type { LocationSeed } from './sources/fetch-location-seeds.ts';
import { assert } from './assert.ts';

const ABILITY_DESCRIPTION_MAX_LENGTH = 131;

export const PROVISIONAL_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE pokemon (id INT, name CHAR(32), primary_type_id TINYINT, secondary_type_id TINYINT, base_hp TINYINT, base_attack TINYINT, base_defense TINYINT, base_sp_attack TINYINT, base_sp_defense TINYINT, base_speed TINYINT)',
    'CREATE TABLE pokemon_types (id TINYINT, name CHAR(12))',
    'CREATE TABLE type_effectiveness (attacking_type_id TINYINT, defending_type_id TINYINT, multiplier_pct TINYINT)',
    'CREATE TABLE sub_areas (id TINYINT, name CHAR(16))',
    'CREATE TABLE terrain_types (id TINYINT, key CHAR(29))',
    'CREATE TABLE evolution_methods (id TINYINT, description CHAR(132))',
    'CREATE TABLE evolution_transitions (from_pokemon_id INT, to_pokemon_id INT, method_id TINYINT)',
    'CREATE TABLE locations (id CHAR(32), name CHAR(27), region CHAR(6), province CHAR(14))',
    `CREATE TABLE abilities (id TINYINT, name CHAR(24), description CHAR(${ABILITY_DESCRIPTION_MAX_LENGTH}))`,
    'CREATE TABLE boss_battles (id TINYINT, name CHAR(44), battle_type CHAR(8))',
    'CREATE TABLE boss_battle_pokemon (boss_battle_id TINYINT, slot TINYINT, pokemon_id INT, level TINYINT, ability_id TINYINT)',
    'CREATE TABLE moves (id INT, name CHAR(32), type_id TINYINT, category CHAR(8), power TINYINT, accuracy TINYINT, effect CHAR(154))',
    'CREATE TABLE boss_battle_pokemon_moves (boss_battle_id TINYINT, pokemon_slot TINYINT, move_slot TINYINT, move_id INT)',
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
    return `CREATE TABLE ${tableName} (sub_area_id TINYINT, pokemon_id INT, games CHAR(2), terrain_id TINYINT, min_level TINYINT, max_level TINYINT, morning_rate TINYINT, day_rate TINYINT, evening_rate TINYINT, night_rate TINYINT)`;
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

export interface PokemonRowWithTypeIds
    extends Omit<
        PokemonData,
        'primary_type' | 'secondary_type' | 'evolution_edges'
    > {
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

    const mappedPokemonRows: PokemonRowWithTypeIds[] = pokemonRows.map(
        (row) => ({
            id: row.id,
            name: row.name,
            base_hp: row.base_hp,
            base_attack: row.base_attack,
            base_defense: row.base_defense,
            base_sp_attack: row.base_sp_attack,
            base_sp_defense: row.base_sp_defense,
            base_speed: row.base_speed,
            primary_type_id: resolveTypeId(row.primary_type),
            secondary_type_id: resolveTypeId(row.secondary_type),
        }),
    );

    return { typeRows, mappedPokemonRows, typeIds };
}

export function buildTypeEffectivenessRows(
    typeIds: Map<string, number>,
): TypeEffectivenessRow[] {
    const rows: TypeEffectivenessRow[] = [];

    for (const [
        attackingTypeName,
        defendingTypeName,
        multiplier,
    ] of TYPE_EFFECTIVENESS_MATRIX) {
        const attacking_type_id = typeIds.get(attackingTypeName.toLowerCase());
        const defending_type_id = typeIds.get(defendingTypeName.toLowerCase());

        if (
            attacking_type_id === undefined ||
            defending_type_id === undefined
        ) {
            throw new Error(
                `Type not found in typeIds map: attacking=${attackingTypeName} (${attacking_type_id}), defending=${defendingTypeName} (${defending_type_id})`,
            );
        }

        // Encode multiplier as TINYINT: multiply by 100
        // 0 -> 0, 0.25 -> 25, 0.5 -> 50, 1 -> 100, 2 -> 200, 4 -> 400
        const multiplier_pct = multiplier * 100;

        rows.push({
            attacking_type_id,
            defending_type_id,
            multiplier_pct,
        });
    }

    if (rows.length !== 324) {
        throw new Error(
            `Expected 324 type effectiveness rows (18×18), got ${rows.length}`,
        );
    }

    return rows;
}

export function buildTerrainRows(locations: readonly LocationSeed[]): {
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

export function buildSubAreaRows(locations: readonly LocationSeed[]): {
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

export function buildEvolutionRows(
    pokemonRows: readonly (PokemonData & { id: number })[],
    pokemonIds: Map<string, number>,
): {
    evolutionMethodRows: { id: number; description: string }[];
    evolutionTransitionRows: {
        from_pokemon_id: number;
        to_pokemon_id: number;
        method_id: number;
    }[];
} {
    const methodIds = new Map<string, number>();
    const transitionKeys = new Set<string>();
    const evolutionMethodRows: { id: number; description: string }[] = [];
    const evolutionTransitionRows: {
        from_pokemon_id: number;
        to_pokemon_id: number;
        method_id: number;
    }[] = [];

    const evolutionEdges = consolidateEvolutionEdges(
        pokemonRows
            .flatMap((row) => row.evolution_edges)
            .map((edge) => ({
                ...edge,
                from: toCanonicalPokemonName(edge.from),
                to: toCanonicalPokemonName(edge.to),
            })),
    );
    for (const edge of evolutionEdges) {
        const fromPokemonId = pokemonIds.get(edge.from);
        const toPokemonId = pokemonIds.get(edge.to);
        assert(fromPokemonId);
        assert(toPokemonId);
        if (fromPokemonId === toPokemonId) {
            continue;
        }

        const description = edge.method.trim();
        if (description.length === 0) {
            continue;
        }

        const methodKey = description.toLowerCase();
        let methodId = methodIds.get(methodKey);
        if (methodId === undefined) {
            methodId = evolutionMethodRows.length + 1;
            methodIds.set(methodKey, methodId);
            evolutionMethodRows.push({ id: methodId, description });
        }

        const transitionKey = `${fromPokemonId}:${toPokemonId}:${methodId}`;
        if (transitionKeys.has(transitionKey)) {
            continue;
        }
        transitionKeys.add(transitionKey);

        evolutionTransitionRows.push({
            from_pokemon_id: fromPokemonId,
            to_pokemon_id: toPokemonId,
            method_id: methodId,
        });
    }
    return { evolutionMethodRows, evolutionTransitionRows };
}

export async function fetchAllPokemonRows(
    pokemonIds: Map<string, number>,
): Promise<(PokemonData & { id: number })[]> {
    const result: (PokemonData & { id: number })[] = [];
    const namesToFetch = [...pokemonIds.keys()];
    let nextPokemonId = pokemonIds.size + 1;

    let failed = false;

    for (let index = 0; index < namesToFetch.length; index += 1) {
        const name = namesToFetch[index];
        const id = pokemonIds.get(name);
        assert(id);

        try {
            const pokemon = { id, ...(await fetchPokemonData(name)) };
            result.push(pokemon);

            for (const edge of pokemon.evolution_edges) {
                for (const rawName of [edge.from, edge.to]) {
                    const relatedName = toCanonicalPokemonName(rawName);
                    if (pokemonIds.has(relatedName)) {
                        continue;
                    }
                    pokemonIds.set(relatedName, nextPokemonId);
                    nextPokemonId += 1;
                    namesToFetch.push(relatedName);
                }
            }
        } catch (error) {
            process.stderr.write(
                `${error instanceof Error ? error.message : String(error)}\n`,
            );
            failed = true;
        }
    }
    if (failed) {
        throw new Error('Some pokemon failed to fetch/parse');
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

export function buildPokemonNameMap(
    locations: readonly LocationSeed[],
    rosters: readonly RawBossRoster[],
    teraRaidPokemonNames: readonly string[],
): Map<string, number> {
    const ids = new Map<string, number>();
    for (const location of locations) {
        for (const encounter of location.encounters) {
            const name = toCanonicalPokemonName(encounter.pokemonName);
            if (!ids.has(name)) {
                ids.set(name, ids.size + 1);
            }
        }
    }
    for (const roster of rosters) {
        for (const entry of roster.party) {
            const name = toCanonicalPokemonName(entry.pokemon);
            if (!ids.has(name)) {
                ids.set(name, ids.size + 1);
            }
        }
    }
    for (const rawName of teraRaidPokemonNames) {
        const name = toCanonicalPokemonName(rawName);
        if (!ids.has(name)) {
            ids.set(name, ids.size + 1);
        }
    }
    return ids;
}

export function buildPokemonIdMap(
    pokemonRows: readonly { name: string }[],
): Map<string, number> {
    const ids = new Map<string, number>();
    for (const row of pokemonRows) {
        const name = toCanonicalPokemonName(row.name);
        if (!ids.has(name)) {
            ids.set(name, ids.size + 1);
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
        const rows = location.encounters.map((encounter) => {
            const sub_area_id = subAreaIds.get(encounter.subArea.trim());
            assert(sub_area_id);
            const pokemon_id = pokemonIds.get(
                toCanonicalPokemonName(encounter.pokemonName),
            );
            assert(pokemon_id);
            const terrain_id = terrainIds.get(
                canonicalTerrainKey(encounter.terrain),
            );
            assert(terrain_id);

            return {
                sub_area_id,
                pokemon_id,
                games: canonicalGameValue(encounter.games),
                terrain_id,
                min_level: encounter.minLevel,
                max_level: encounter.maxLevel,
                morning_rate: encounter.morningRate,
                day_rate: encounter.dayRate,
                evening_rate: encounter.eveningRate,
                night_rate: encounter.nightRate,
            };
        });

        if (rows.length === 0) {
            continue;
        }

        await db.insertInto(location.slug).values(rows).execute();
    }
}

export interface RawBossRoster {
    bossIndex: number;
    party: TrainerPartyEntry[];
}

export async function fetchAllBossRosters(
    bossSeeds: readonly BossFightSeed[],
): Promise<RawBossRoster[]> {
    const results = await Promise.allSettled(
        bossSeeds.map(async (seed, index) => {
            const party = await fetchTrainerParty(seed);
            return { bossIndex: index, party };
        }),
    );
    const rosters: RawBossRoster[] = [];
    let failed = false;
    for (const r of results) {
        if (r.status === 'fulfilled') {
            rosters.push(r.value);
        } else {
            failed = true;
            process.stderr.write(
                `${r.reason instanceof Error ? r.reason.message : String(r.reason)}\n`,
            );
        }
    }
    if (failed) {
        throw new Error('Some boss rosters failed to fetch/parse');
    }
    return rosters;
}

function truncateUtf8(value: string, maxBytes: number): string {
    const encoder = new TextEncoder();
    if (encoder.encode(value).length <= maxBytes) {
        return value;
    }
    let result = '';
    for (const char of value) {
        const next = result + char;
        if (encoder.encode(next).length > maxBytes) {
            break;
        }
        result = next;
    }
    return result;
}

export async function buildAbilityRows(
    abilityNames: ReadonlySet<string>,
): Promise<{ abilityRows: AbilityRow[]; abilityIds: Map<string, number> }> {
    const uniqueNames = [...abilityNames];
    const results = await Promise.allSettled(
        uniqueNames.map(async (name) => {
            const data = await fetchAbilityData(name);
            return { name, data };
        }),
    );

    const abilityIds = new Map<string, number>();
    const abilityRows: AbilityRow[] = [];
    let _truncatedCount = 0;
    let failed = false;

    for (const r of results) {
        if (r.status === 'rejected') {
            failed = true;
            process.stderr.write(
                `${r.reason instanceof Error ? r.reason.message : String(r.reason)}\n`,
            );
            continue;
        }

        const { name, data } = r.value;
        const id = abilityRows.length + 1;
        abilityIds.set(name, id);
        const description = truncateUtf8(
            data.description,
            ABILITY_DESCRIPTION_MAX_LENGTH,
        );
        if (description.length < data.description.length) {
            _truncatedCount++;
        }
        abilityRows.push({
            id,
            name,
            description,
        });
    }

    if (failed) {
        throw new Error('Some abilities failed to fetch/parse');
    }

    return { abilityRows, abilityIds };
}

export function buildBossBattlePokemonRows(
    rosters: readonly RawBossRoster[],
    pokemonIds: Map<string, number>,
    abilityIds: Map<string, number>,
): BossBattlePokemonRow[] {
    const rows: BossBattlePokemonRow[] = [];
    for (const roster of rosters) {
        const bossId = roster.bossIndex + 1;
        for (let slot = 0; slot < roster.party.length; slot++) {
            const entry = roster.party[slot];
            const pokemonId = pokemonIds.get(
                toCanonicalPokemonName(entry.pokemon),
            );
            if (pokemonId === undefined) {
                throw new Error(
                    `[Boss id=${bossId}] Unknown Pokémon: "${entry.pokemon}"`,
                );
            }
            const abilityId = abilityIds.get(entry.ability) ?? 0;
            rows.push({
                boss_battle_id: bossId,
                slot: slot + 1,
                pokemon_id: pokemonId,
                level: entry.level,
                ability_id: abilityId,
            });
        }
    }
    return rows;
}

export async function buildMoveRows(
    allMoveNames: readonly string[],
    typeIds: Map<string, number>,
): Promise<{ moveRows: MoveRow[]; moveIds: Map<string, number> }> {
    const uniqueNames = [...new Set(allMoveNames)];
    const results = await Promise.allSettled(
        uniqueNames.map(async (name) => {
            const data = await fetchMoveData(name);
            return { name, data };
        }),
    );
    const moveRows: MoveRow[] = [];
    const moveIds = new Map<string, number>();
    let failed = false;
    for (const r of results) {
        if (r.status === 'rejected') {
            failed = true;
            process.stderr.write(
                `${r.reason instanceof Error ? r.reason.message : String(r.reason)}\n`,
            );
            continue;
        }
        const { name, data } = r.value;
        const id = moveRows.length + 1;
        const typeId = typeIds.get(data.type) ?? 0;
        moveIds.set(name, id);
        moveRows.push({
            id,
            name,
            type_id: typeId,
            category: data.category,
            power: data.power,
            accuracy: data.accuracy,
            effect: data.effect,
        });
    }
    if (failed) {
        throw new Error('Some moves failed to fetch/parse');
    }
    return { moveRows, moveIds };
}

export function buildBossBattlePokemonMoveRows(
    rosters: readonly RawBossRoster[],
    moveIds: Map<string, number>,
): BossBattlePokemonMoveRow[] {
    const rows: BossBattlePokemonMoveRow[] = [];
    for (const roster of rosters) {
        const bossId = roster.bossIndex + 1;
        for (let slot = 0; slot < roster.party.length; slot++) {
            const entry = roster.party[slot];
            for (let moveSlot = 0; moveSlot < entry.moves.length; moveSlot++) {
                const moveName = entry.moves[moveSlot];
                const moveId = moveIds.get(moveName);
                if (moveId === undefined) {
                    throw new Error(
                        `[Boss id=${bossId}, slot ${slot + 1}] Unknown move: "${moveName}"`,
                    );
                }
                rows.push({
                    boss_battle_id: bossId,
                    pokemon_slot: slot + 1,
                    move_slot: moveSlot + 1,
                    move_id: moveId,
                });
            }
        }
    }
    return rows;
}
