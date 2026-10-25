import { DB, type StoragePlugin } from '@project-dragalge/db';
import { createDb } from '@project-dragalge/query-builder';
import {
    base64ToBytes,
    bytesToBase64,
    gzipDecode,
    gzipEncode,
} from '../../utils/compression';
import { getGameExportData } from './queries';
import type {
    BanListEntryRow,
    BossBattleProgressRow,
    EncounterRollRow,
    GameRun,
} from './queries';
import {
    allocateGameIdentity,
    insertBanListEntries,
    insertBossBattleProgress,
    insertEncounterRolls,
    insertGameRunRecords,
    selectBanListEntries,
    selectBossBattleProgress,
    selectEncounterRolls,
    selectGameRunRecords,
    toGameRun,
} from './internal';
import { getGameDb } from './client';
import {
    GAME_DB_SCHEMA_SQL,
    GAME_DB_SCHEMA_VERSION,
    type GameRunsDb,
} from './schema';

export const EXPORT_FORMAT_VERSION = 1;

export type ParsedImport =
    | {
          status: 'ok';
          game: GameRun;
          banListEntries: BanListEntryRow[];
          encounterRolls: EncounterRollRow[];
          bossProgress: BossBattleProgressRow[];
      }
    | { status: 'error'; message: string };

export async function buildExport(gameName: string): Promise<string> {
    const { game, banListEntries, encounterRolls, bossProgress } =
        await getGameExportData(gameName);
    const storage = new CaptureStoragePlugin();
    const db = createExportDatabase(storage);

    // The export database holds a single game; its id only links the rows together.
    const record = { ...game, ...allocateGameIdentity(game.name, []) };
    await insertGameRunRecords(db, [record]);
    await insertBanListEntries(db, record.id, banListEntries);
    await insertEncounterRolls(db, record.id, encounterRolls);
    await insertBossBattleProgress(db, record.id, bossProgress);

    await storage.save();
    const payload = new Uint8Array(2 + storage.blob.length);
    payload[0] = EXPORT_FORMAT_VERSION;
    payload[1] = GAME_DB_SCHEMA_VERSION;
    payload.set(storage.blob, 2);
    return bytesToBase64(await gzipEncode(payload));
}

export async function parseImport(
    exportedGame: string,
): Promise<ParsedImport> {
    try {
        const compressed = base64ToBytes(exportedGame);
        const payload = await gzipDecode(compressed);
        if (payload[0] !== EXPORT_FORMAT_VERSION) {
            return { status: 'error', message: 'This link uses an unsupported export format.' };
        }
        if (payload[1] !== GAME_DB_SCHEMA_VERSION) {
            return { status: 'error', message: 'This link was created for an incompatible game database version.' };
        }

        const db = await loadImportDatabase(payload.slice(2));
        const games = await selectGameRunRecords(db);
        if (games.length !== 1) {
            return { status: 'error', message: 'This link does not contain exactly one game.' };
        }
        const record = games[0];
        const [banListEntries, encounterRolls, bossProgress] = await Promise.all([
            selectBanListEntries(db, record.id),
            selectEncounterRolls(db, record.id),
            selectBossBattleProgress(db, record.id),
        ]);
        return {
            status: 'ok',
            game: toGameRun(record),
            banListEntries,
            encounterRolls,
            bossProgress,
        };
    } catch {
        return { status: 'error', message: 'This link is invalid or corrupted.' };
    }
}

export async function applyImport(
    imported: Extract<ParsedImport, { status: 'ok' }>,
    requestedName: string,
): Promise<GameRun> {
    const db = await getGameDb();
    const existing = await selectGameRunRecords(db);
    const identity = allocateGameIdentity(requestedName, existing);
    const record = { ...imported.game, ...identity, createdAt: Date.now() };

    await insertGameRunRecords(db, [record]);
    await insertBanListEntries(db, record.id, imported.banListEntries);
    await insertEncounterRolls(db, record.id, imported.encounterRolls);
    await insertBossBattleProgress(db, record.id, imported.bossProgress);
    return toGameRun(record);
}

function createExportDatabase(storage: CaptureStoragePlugin) {
    const rawDb = new DB(storage, {});
    for (const sql of GAME_DB_SCHEMA_SQL) {
        rawDb.execute(sql, []);
    }
    storage.setDatabase(rawDb);
    return createDb<GameRunsDb>(rawDb);
}

async function loadImportDatabase(blob: Uint8Array) {
    const rawDb = new DB(new FixedStoragePlugin(blob));
    if (!(await rawDb.load())) {
        throw new Error('Missing export database.');
    }
    return createDb<GameRunsDb>(rawDb);
}

class CaptureStoragePlugin implements StoragePlugin {
    blob = new Uint8Array();
    private database: DB | undefined;

    read(): null {
        return null;
    }

    write(blob: Uint8Array): void {
        this.blob = Uint8Array.from(blob);
    }

    setDatabase(database: DB): void {
        this.database = database;
    }

    async save(): Promise<void> {
        await this.database?.save();
    }
}

class FixedStoragePlugin implements StoragePlugin {
    constructor(private readonly blob: Uint8Array) {}

    read(): Uint8Array {
        return this.blob;
    }

    write(): void {}
}

