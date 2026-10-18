import { DB } from '@project-dragalge/db';
import { createDb, type Database } from '@project-dragalge/query-builder';
import { LocalStoragePlugin } from './local-storage-plugin';
import {
    GAME_DB_SCHEMA_SQL,
    GAME_DB_SCHEMA_VERSION,
    type GameRunsDb,
} from './schema';

let gameDbPromise: Promise<Database<GameRunsDb>> | undefined;

async function initGameDb(): Promise<Database<GameRunsDb>> {
    const db = new DB(new LocalStoragePlugin(GAME_DB_SCHEMA_VERSION));
    // A blob saved under a previous, incompatible encoding must not permanently break the DB.
    let loaded: boolean;
    try {
        loaded = await db.load();
    } catch {
        loaded = false;
    }
    if (!loaded) {
        for (const sql of GAME_DB_SCHEMA_SQL) {
            db.execute(sql, []);
        }
    }
    return createDb<GameRunsDb>(db);
}

// Memoized so every caller shares the same in-memory DB/localStorage state.
export function getGameDb(): Promise<Database<GameRunsDb>> {
    if (!gameDbPromise) {
        gameDbPromise = initGameDb();
    }
    return gameDbPromise;
}
