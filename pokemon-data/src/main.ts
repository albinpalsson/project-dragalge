import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '@pokedb2/query-builder';
import { DbClient } from './logging-db-client.ts';
import type { PokemonDataDb } from './schema.ts';
import { initializeDb, insertLocationEncounters, buildPokemonIdMap, fetchAllPokemonRows } from './schema-init.ts';
import { fetchBossFightSeeds, fetchLocationSeeds } from './sources/index.ts';

async function main(): Promise<void> {
    const root = resolve(dirname(fileURLToPath(import.meta.url)));
    const artifactsDir = resolve(root, 'artifacts');
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
    await db.insertInto('pokemon').values(pokemonRows).execute();
    await insertLocationEncounters(db, locations, pokemonIds);

    // Insert boss identity/order seeds; roster mapping will be web-enriched later.
    const bossRows = bossSeeds.map((boss, index) => ({
        id: index + 1,
        name: boss.name,
        battle_type: boss.type,
    }));
    await db.insertInto('boss_battles').values(bossRows).execute();
    await client.save();

    process.stdout.write(
        `Built db with\n ${pokemonRows.length} pokemon,\n ${locationRows.length} locations,\n ${bossRows.length} boss battles\n`,
    );
}

void main().catch((err: unknown) => {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
});
