import { DB } from '@project-dragalge/db';
import { createDb, type Database } from '@project-dragalge/query-builder';
import { GoogleDriveStoragePlugin } from './google-drive-plugin';
import { LocalStoragePlugin } from './local-storage-plugin';
import { getStorageMode } from './storage-mode';
import {
    GAME_DB_SCHEMA_SQL,
    GAME_DB_SCHEMA_VERSION,
    type GameRunsDb,
} from './schema';

let gameDbPromise: Promise<Database<GameRunsDb>> | undefined;

async function initGameDb(): Promise<Database<GameRunsDb>> {
    const useDrive = getStorageMode() === 'google-drive';
    const db = new DB(
        useDrive
            ? new GoogleDriveStoragePlugin(GAME_DB_SCHEMA_VERSION)
            : new LocalStoragePlugin(GAME_DB_SCHEMA_VERSION),
    );
    // A blob saved under a previous, incompatible encoding must not permanently break the DB.
    // Drive is the exception: failing to read it says nothing about its content,
    // and an empty database in its place would hide the user's games.
    let loaded: boolean;
    try {
        loaded = await db.load();
    } catch (error) {
        if (useDrive) {
            throw error;
        }
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
