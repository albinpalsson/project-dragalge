import { DB } from '@project-dragalge/db';
import { createDb, type Database } from '@project-dragalge/query-builder';
import paldeaBlob, { type PokemonDataDb } from '@project-dragalge/pokemon-data';
import { StaticStoragePlugin } from './static-storage-plugin';

let pokemonDbPromise: Promise<Database<PokemonDataDb>> | undefined;

async function initPokemonDb(): Promise<Database<PokemonDataDb>> {
    const db = new DB(new StaticStoragePlugin(paldeaBlob));
    await db.load();
    return createDb<PokemonDataDb>(db);
}

// Memoized so the blob is only decoded once per session.
export function getPokemonDb(): Promise<Database<PokemonDataDb>> {
    if (!pokemonDbPromise) {
        pokemonDbPromise = initPokemonDb();
    }
    return pokemonDbPromise;
}
