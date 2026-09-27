import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDb } from '@pokedb2/query-builder';
import { fetchPokemonIcons } from './fetch/index.ts';
import { DbClient } from './logging-db-client.ts';
import type { PokemonDataDb } from './schema.ts';
import {
    buildAbilityRows,
    buildBossBattlePokemonMoveRows,
    buildBossBattlePokemonRows,
    buildEvolutionRows,
    buildMoveRows,
    buildPokemonNameMap,
    buildSubAreaRows,
    buildTerrainRows,
    buildTypeRowsAndPokemonRows,
    buildTypeEffectivenessRows,
    fetchAllBossRosters,
    fetchAllPokemonRows,
    initializeDb,
    insertLocationEncounters,
} from './schema-init.ts';
import {
    fetchBossFightSeeds,
    fetchLocationSeeds,
    fetchTeraRaidSeeds,
} from './sources/index.ts';

async function main(): Promise<void> {
    const root = resolve(dirname(fileURLToPath(import.meta.url)));
    const artifactsDir = resolve(root, '..', 'artifacts');
    const assetsDir = resolve(artifactsDir, 'assets');
    const dbPath = resolve(artifactsDir, 'paldea-db.js');

    await mkdir(artifactsDir, { recursive: true });
    await mkdir(assetsDir, { recursive: true });
    const client = new DbClient(dbPath, { growthFactor: 1 });

    // Load local seed data first so schema generation can follow data shape.
    const { locations } = await fetchLocationSeeds();
    const bossSeeds = await fetchBossFightSeeds();
    const teraRaidPokemonNames = await fetchTeraRaidSeeds([1, 2, 3, 4]);

    // Fetch boss rosters early so boss Pokémon are included in the unified pokemonIds map.
    const rawRosters = await fetchAllBossRosters(bossSeeds);

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

    // Start with encounter and boss Pokémon; fetching expands the map to their evolution lines.
    const pokemonIds = buildPokemonNameMap(
        locations,
        rawRosters,
        teraRaidPokemonNames,
    );

    const pokemonRows = await fetchAllPokemonRows(pokemonIds);

    const iconData = await fetchPokemonIcons([...pokemonIds.keys()], assetsDir);

    const { typeRows, mappedPokemonRows, typeIds } =
        buildTypeRowsAndPokemonRows(pokemonRows);
    await db.insertInto('pokemon_types').values(typeRows).execute();

    const typeEffects = buildTypeEffectivenessRows(typeIds);
    await db.insertInto('type_effectiveness').values(typeEffects).execute();

    await db.insertInto('pokemon').values(mappedPokemonRows).execute();

    const { evolutionMethodRows, evolutionTransitionRows } = buildEvolutionRows(
        pokemonRows,
        pokemonIds,
    );
    await db
        .insertInto('evolution_methods')
        .values(evolutionMethodRows)
        .execute();
    await db
        .insertInto('evolution_transitions')
        .values(evolutionTransitionRows)
        .execute();

    const { subAreaRows, subAreaIds } = buildSubAreaRows(locations);
    await db.insertInto('sub_areas').values(subAreaRows).execute();

    const { terrainRows, terrainIds } = buildTerrainRows(locations);
    await db.insertInto('terrain_types').values(terrainRows).execute();

    await insertLocationEncounters(
        db,
        locations,
        pokemonIds,
        subAreaIds,
        terrainIds,
    );

    // Insert boss identity/order seeds.
    const bossRows = bossSeeds.map((boss, index) => ({
        id: index + 1,
        name: boss.name,
        battle_type: boss.type,
    }));
    await db.insertInto('boss_battles').values(bossRows).execute();

    // Build and insert abilities (de-duped from all boss rosters).
    const allAbilityNames = new Set(
        rawRosters
            .flatMap((r) => r.party.map((p) => p.ability))
            .filter(Boolean),
    );
    const { abilityRows, abilityIds } = await buildAbilityRows(allAbilityNames);
    await db.insertInto('abilities').values(abilityRows).execute();

    // Build and insert boss_battle_pokemon (with slot positions).
    const bossBattlePokemonRows = buildBossBattlePokemonRows(
        rawRosters,
        pokemonIds,
        abilityIds,
    );
    await db
        .insertInto('boss_battle_pokemon')
        .values(bossBattlePokemonRows)
        .execute();

    // Fetch move data for every unique move used in boss battles.
    const allMoveNames = rawRosters.flatMap((r) =>
        r.party.flatMap((p) => p.moves),
    );
    const { moveRows, moveIds } = await buildMoveRows(allMoveNames, typeIds);
    await db.insertInto('moves').values(moveRows).execute();

    // Build and insert boss_battle_pokemon_moves join rows.
    const bossMoveLinkRows = buildBossBattlePokemonMoveRows(
        rawRosters,
        moveIds,
    );
    await db
        .insertInto('boss_battle_pokemon_moves')
        .values(bossMoveLinkRows)
        .execute();

    await client.save();

    const size = (await readFile(dbPath))?.byteLength ?? 0;

    process.stdout.write(
        `Exported ${iconData.written.length} icons (${(iconData.totalBytes / 1000).toFixed(2)} KB).
Built db (${(size / 1000).toFixed(2)} KB) with:
  ${pokemonRows.length} pokemon,
  ${evolutionMethodRows.length} evolution methods,
  ${locationRows.length} locations,
  ${bossRows.length} boss battles,
  ${bossBattlePokemonRows.length} boss battle pokemon,
  ${moveRows.length} moves,
  ${subAreaRows.length} sub-areas,
  ${terrainRows.length} terrain types,
  ${typeRows.length} types\n`,
    );
}

void main().catch((err: unknown) => {
    process.stderr.write(
        `${err instanceof Error ? err.message : String(err)}\n`,
    );
    process.exitCode = 1;
});
