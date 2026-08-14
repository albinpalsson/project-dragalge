import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '@pokedb2/query-builder';
import { DbClient } from './logging-db-client.ts';
import type { PokemonDataDb } from './schema.ts';
import {
    initializeDb,
    insertLocationEncounters,
    buildPokemonIdMap,
    fetchAllPokemonRows,
    buildSubAreaRows,
    buildTypeRowsAndPokemonRows,
    buildTerrainRows,
} from './schema-init.ts';
import { fetchBossFightSeeds, fetchLocationSeeds } from './sources/index.ts';

async function main(): Promise<void> {
    const root = resolve(dirname(fileURLToPath(import.meta.url)));
    const artifactsDir = resolve(root, '..', 'artifacts');
    const dbPath = resolve(artifactsDir, 'paldea-db.js');

    await mkdir(artifactsDir, { recursive: true });
    const client = new DbClient(dbPath, { growthFactor: 1 });

    // Load local seed data first so schema generation can follow data shape.
    const { locations } = await fetchLocationSeeds();
    const bossSeeds = await fetchBossFightSeeds();

    // Initialize schema and one physical encounter table per location.
    await initializeDb(dbPath, client, locations);
    const db = createDb<PokemonDataDb>(client);

    // Insert normalized locations and per-location encounter rows.
    const locationRows = locations.map((location) => ({
        id: location.slug,
        name: location.name,
        region: location.region,
        province: location.province,
    }));
    await db.insertInto('locations').values(locationRows).execute();

    const pokemonIds = buildPokemonIdMap(locations);
    const pokemonRows = await fetchAllPokemonRows(pokemonIds);

    const { typeRows, mappedPokemonRows } = buildTypeRowsAndPokemonRows(pokemonRows);
    await db.insertInto('pokemon_types').values(typeRows).execute();
    await db.insertInto('pokemon').values(mappedPokemonRows).execute();

    const { subAreaRows, subAreaIds } = buildSubAreaRows(locations);
    await db.insertInto('sub_areas').values(subAreaRows).execute();

    const { terrainRows, terrainIds } = buildTerrainRows(locations);
    await db.insertInto('terrain_types').values(terrainRows).execute();
    
    await insertLocationEncounters(db, locations, pokemonIds, subAreaIds, terrainIds);

    // Insert boss identity/order seeds; roster mapping will be web-enriched later.
    const bossRows = bossSeeds.map((boss, index) => ({
        id: index + 1,
        name: boss.name,
        battle_type: boss.type,
    }));
    await db.insertInto('boss_battles').values(bossRows).execute();
    await client.save();

    const size = (await readFile(dbPath))?.byteLength ?? 0;

    process.stdout.write(
        `Built db (${(size/1000).toFixed(2)} KB) with
  ${pokemonRows.length} pokemon,
  ${locationRows.length} locations,
  ${bossRows.length} boss battles,
  ${subAreaRows.length} sub-areas,
  ${terrainRows.length} terrain types,
  ${typeRows.length} types`,
    );
}

void main().catch((err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
});
