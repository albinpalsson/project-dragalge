// Game ids are storage details. Only the game-db layer (queries.ts and
// export-import.ts) may import this module; views and hooks address games by name.
import type { Database } from '@project-dragalge/query-builder';
import {
    decodeBossBattleResult,
    decodeEncounterStatus,
    decodeGameSettings,
    encodeBossBattleResult,
    encodeEncounterStatus,
    encodeGameSettings,
} from './codecs';
import type {
    BanListEntryRow,
    BossBattleProgressRow,
    EncounterRollRow,
    GameRun,
} from './queries';
import type { GameRunsDb } from './schema';

export const GAME_NAME_MAX_BYTES = 128;

export interface GameRunRecord extends GameRun {
    id: string;
}

export async function selectGameRunRecords(
    db: Database<GameRunsDb>,
): Promise<GameRunRecord[]> {
    const rows = await db.selectFrom('game_runs').selectAll().execute();
    // The db reuses deleted row slots and has no ORDER BY, so order by creation time here.
    return rows
        .map(gameRunRecordFromRow)
        .sort((first, second) => first.createdAt - second.createdAt);
}

export function toGameRun({ id: _id, ...game }: GameRunRecord): GameRun {
    return game;
}

export async function findGameRunRecord(
    db: Database<GameRunsDb>,
    gameName: string,
): Promise<GameRunRecord | undefined> {
    const row = await db
        .selectFrom('game_runs')
        .selectAll()
        .where('name', '=', gameName)
        .executeTakeFirst();
    return row ? gameRunRecordFromRow(row) : undefined;
}

export async function resolveGameRunId(
    db: Database<GameRunsDb>,
    gameName: string,
): Promise<string> {
    const record = await findGameRunRecord(db, gameName);
    if (!record) {
        throw new Error(`Game not found: ${gameName}`);
    }
    return record.id;
}

export async function insertGameRunRecords(
    db: Database<GameRunsDb>,
    records: readonly GameRunRecord[],
): Promise<void> {
    if (records.length === 0) {
        return;
    }
    const existing = await selectGameRunRecords(db);
    const names = new Set(existing.map((game) => game.name));
    for (const record of records) {
        if (names.has(record.name)) {
            throw new Error(`Game name already exists: ${record.name}`);
        }
        names.add(record.name);
    }
    await db
        .insertInto('game_runs')
        .values(
            records.map((record) => ({
                id: record.id,
                created_at: record.createdAt,
                name: record.name,
                variant: record.variant,
                ...encodeGameSettings(record.settings),
            })),
        )
        .execute();
}

export async function selectBanListEntries(
    db: Database<GameRunsDb>,
    gameRunId: string,
): Promise<BanListEntryRow[]> {
    const rows = await db
        .selectFrom('ban_list_entries')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
    return rows.map(({ pokemon_name }) => ({ pokemon_name }));
}

export async function insertBanListEntries(
    db: Database<GameRunsDb>,
    gameRunId: string,
    rows: readonly BanListEntryRow[],
): Promise<void> {
    if (rows.length === 0) {
        return;
    }
    await db
        .insertInto('ban_list_entries')
        .values(rows.map((row) => ({ ...row, game_run_id: gameRunId })))
        .execute();
}

export async function selectEncounterRolls(
    db: Database<GameRunsDb>,
    gameRunId: string,
): Promise<EncounterRollRow[]> {
    const rows = await db
        .selectFrom('encounter_rolls')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
    return rows.map(({ game_run_id: _gameRunId, ...row }) => ({
        ...row,
        status: decodeEncounterStatus(row.status),
    }));
}

export async function insertEncounterRolls(
    db: Database<GameRunsDb>,
    gameRunId: string,
    rows: readonly EncounterRollRow[],
): Promise<void> {
    if (rows.length === 0) {
        return;
    }
    await db
        .insertInto('encounter_rolls')
        .values(
            rows.map((row) => ({
                ...row,
                game_run_id: gameRunId,
                status: encodeEncounterStatus(row.status),
            })),
        )
        .execute();
}

export async function selectBossBattleProgress(
    db: Database<GameRunsDb>,
    gameRunId: string,
): Promise<BossBattleProgressRow[]> {
    const rows = await db
        .selectFrom('boss_battle_progress')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
    return rows.map(({ game_run_id: _gameRunId, ...row }) => ({
        ...row,
        result: decodeBossBattleResult(row.result),
    }));
}

export async function insertBossBattleProgress(
    db: Database<GameRunsDb>,
    gameRunId: string,
    rows: readonly BossBattleProgressRow[],
): Promise<void> {
    if (rows.length === 0) {
        return;
    }
    await db
        .insertInto('boss_battle_progress')
        .values(
            rows.map((row) => ({
                ...row,
                game_run_id: gameRunId,
                result: encodeBossBattleResult(row.result),
            })),
        )
        .execute();
}

export function allocateGameIdentity(
    requestedName: string,
    existing: readonly Pick<GameRunRecord, 'id' | 'name'>[],
): Pick<GameRunRecord, 'id' | 'name'> {
    const baseName = requestedName.trim();
    assertGameNameFits(baseName);

    const names = new Set(existing.map((game) => game.name));
    let name = baseName;
    let suffix = 1;
    while (names.has(name)) {
        name = `${baseName}-${suffix++}`;
    }

    const ids = new Set(existing.map((game) => game.id));
    let id = randomGameId();
    while (ids.has(id)) {
        id = randomGameId();
    }
    return { id, name };
}

function gameRunRecordFromRow(row: GameRunsDb['game_runs']): GameRunRecord {
    const { id, created_at, name, variant, ...encodedSettings } = row;
    return {
        id,
        createdAt: created_at,
        name,
        variant,
        settings: decodeGameSettings(encodedSettings),
    };
}

// Must fit the CHAR(4) id columns in the game DB schema.
function randomGameId(): string {
    return crypto.randomUUID().slice(0, 4);
}

export function assertGameNameFits(name: string): void {
    if (new TextEncoder().encode(name).length > GAME_NAME_MAX_BYTES) {
        throw new Error(
            `Game name must be ${GAME_NAME_MAX_BYTES} bytes or fewer`,
        );
    }
}
