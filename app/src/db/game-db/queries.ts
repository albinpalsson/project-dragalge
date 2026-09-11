import type { RandomizerMode } from '../../randomizer';
import { getGameDb } from './client';
import type {
    EncounterRollRow,
    EncounterStatus,
    GameRunRow,
    BossBattleProgressRow,
    BossBattleResult,
} from './schema';
import { NO_PARTY_SLOT } from './schema';

export type GameVariant = 's' | 'v';

const VARIANT_NAMES: Record<GameVariant, string> = {
    s: 'scarlet',
    v: 'violet',
};

function randomShortHash(): string {
    return crypto.randomUUID().slice(0, 8);
}

export function generateDefaultGameName(variant: GameVariant): string {
    return `game-${VARIANT_NAMES[variant]}-${randomShortHash()}`;
}

export async function listGames(): Promise<GameRunRow[]> {
    const db = await getGameDb();
    return db.selectFrom('game_runs').selectAll().execute();
}

export interface GameRunSettings {
    pocoPathOcean: boolean;
}

export interface GameRun {
    id: string;
    variant: string;
    randomizer_mode: string;
    settings: GameRunSettings;
}

function gameRunFromRow(row: GameRunRow): GameRun {
    return {
        id: row.id,
        variant: row.variant,
        randomizer_mode: row.randomizer_mode,
        settings: {
            pocoPathOcean: row.poco_path_ocean === 1,
        },
    };
}

export async function getGameRun(
    gameRunId: string,
): Promise<GameRun | undefined> {
    const db = await getGameDb();
    const row = await db
        .selectFrom('game_runs')
        .selectAll()
        .where('id', '=', gameRunId)
        .executeTakeFirst();
    return row ? gameRunFromRow(row) : undefined;
}

export interface CreateGameInput {
    name: string;
    variant: GameVariant;
    randomizerMode: RandomizerMode;
}

export async function createGame(input: CreateGameInput): Promise<GameRunRow> {
    const db = await getGameDb();
    const existing = await listGames();
    const existingIds = new Set(existing.map((row) => row.id));

    const baseName = input.name.trim();
    let newName = baseName;
    let count = 1;
    while (existingIds.has(newName)) {
        newName = `${baseName}-${count++}`;
    }

    const row: GameRunRow = {
        id: newName,
        variant: input.variant,
        randomizer_mode: input.randomizerMode,
        poco_path_ocean: 0,
    };
    await db.insertInto('game_runs').values(row).execute();
    return row;
}

export const STARTER_LOCATION_NAME = 'Starter';

export async function listEncounterRolls(
    gameRunId: string,
): Promise<EncounterRollRow[]> {
    const db = await getGameDb();
    return db
        .selectFrom('encounter_rolls')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
}

export interface AddEncounterRollInput {
    gameRunId: string;
    locationName: string;
    pokemonName: string;
    status?: EncounterStatus;
}

export async function addEncounterRoll(
    input: AddEncounterRollInput,
): Promise<EncounterRollRow> {
    const db = await getGameDb();
    const row: EncounterRollRow = {
        game_run_id: input.gameRunId,
        location_name: input.locationName,
        pokemon_name: input.pokemonName,
        status: input.status ?? 'pending',
        party_slot: NO_PARTY_SLOT,
    };
    await db.insertInto('encounter_rolls').values(row).execute();
    return row;
}

export interface SetEncounterRollStatusInput {
    gameRunId: string;
    locationName: string;
    status: EncounterStatus;
}

export async function setEncounterRollStatus(
    input: SetEncounterRollStatusInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .updateTable('encounter_rolls')
        .set({ status: input.status })
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface SetPartySlotInput {
    gameRunId: string;
    locationName: string;
    slot: number;
}

export async function setPartySlot(input: SetPartySlotInput): Promise<void> {
    const db = await getGameDb();
    await db
        .updateTable('encounter_rolls')
        .set({ party_slot: input.slot })
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface ClearEncounterRollInput {
    gameRunId: string;
    locationName: string;
}

export async function clearEncounterRoll(
    input: ClearEncounterRollInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .deleteFrom('encounter_rolls')
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface SetPocoPathOceanSettingInput {
    gameRunId: string;
    includeOcean: boolean;
}

export async function setPocoPathOceanSetting(
    input: SetPocoPathOceanSettingInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .updateTable('game_runs')
        .set({
            poco_path_ocean: input.includeOcean ? 1 : 0,
        })
        .where('id', '=', input.gameRunId)
        .execute();
}

export async function listBossBattleProgress(
    gameRunId: string,
): Promise<BossBattleProgressRow[]> {
    const db = await getGameDb();
    return db
        .selectFrom('boss_battle_progress')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
}

export interface SetBossBattleResultInput {
    gameRunId: string;
    battleName: string;
    result: BossBattleResult;
}

export async function setBossBattleResult(
    input: SetBossBattleResultInput,
): Promise<BossBattleProgressRow> {
    const db = await getGameDb();
    const row: BossBattleProgressRow = {
        game_run_id: input.gameRunId,
        battle_name: input.battleName,
        result: input.result,
    };

    const affectedRows = await db
        .updateTable('boss_battle_progress')
        .set({ result: input.result })
        .where('game_run_id', '=', input.gameRunId)
        .where('battle_name', '=', input.battleName)
        .execute();

    if (affectedRows.length === 0) {
        await db.insertInto('boss_battle_progress').values(row).execute();
    }

    return row;
}

export interface ClearBossBattleResultInput {
    gameRunId: string;
    battleName: string;
}

export async function clearBossBattleResult(
    input: ClearBossBattleResultInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .deleteFrom('boss_battle_progress')
        .where('game_run_id', '=', input.gameRunId)
        .where('battle_name', '=', input.battleName)
        .execute();
}
