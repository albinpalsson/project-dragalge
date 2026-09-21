import type { RandomizerMode } from '../../randomizer';
import { getGameDb } from './client';
import type {
    BooleanFlag,
    BossBattleResultCode,
    EncounterStatusCode,
    GameRunsDb,
    RandomizerModeCode,
} from './schema';
import { NO_PARTY_SLOT } from './schema';

export type GameVariant = 's' | 'v';
export type EncounterStatus = 'pending' | 'caught' | 'missed' | 'eliminated';
export type BossBattleResult = 'won' | 'lost';
export const GAME_NAME_MAX_BYTES = 128;

export interface GameRunRow {
    id: number;
    name: string;
    variant: string;
    randomizer_mode: RandomizerMode;
    poco_path_ocean: BooleanFlag;
}

export interface EncounterRollRow {
    game_run_id: number;
    location_name: string;
    pokemon_name: string;
    rolled_as: string;
    status: EncounterStatus;
    party_slot: number;
}

export interface BossBattleProgressRow {
    game_run_id: number;
    battle_name: string;
    result: BossBattleResult;
}

export function generateDefaultGameName(variant: GameVariant): string {
    return `game-${VARIANT_NAMES[variant]}-${randomShortHash()}`;
}

export async function listGames(): Promise<GameRunRow[]> {
    const db = await getGameDb();
    const rows = await db.selectFrom('game_runs').selectAll().execute();
    return rows.map((row) => ({
        ...row,
        randomizer_mode: decodeRandomizerMode(row.randomizer_mode),
    }));
}

export interface GameRunSettings {
    pocoPathOcean: boolean;
}

export interface GameRun {
    id: number;
    name: string;
    variant: string;
    randomizer_mode: string;
    settings: GameRunSettings;
}

export async function getGameRun(
    gameRunName: string,
): Promise<GameRun | undefined> {
    const db = await getGameDb();
    const row = await db
        .selectFrom('game_runs')
        .selectAll()
        .where('name', '=', gameRunName)
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
    const existingNames = new Set(existing.map((row) => row.name));

    const baseName = input.name.trim();
    assertGameNameFits(baseName);
    let newName = baseName;
    let count = 1;
    while (existingNames.has(newName)) {
        newName = `${baseName}-${count++}`;
    }

    const existingIds = new Set(existing.map((row) => row.id));
    let nextId = 1;
    while (existingIds.has(nextId) && nextId <= 255) {
        nextId += 1;
    }
    if (nextId > 255) {
        throw new Error('Cannot create more than 255 games');
    }

    const row = {
        id: nextId,
        name: newName,
        variant: input.variant,
        randomizer_mode: encodeRandomizerMode(input.randomizerMode),
        poco_path_ocean: 0,
    } as const;
    await db.insertInto('game_runs').values(row).execute();
    return {
        ...row,
        randomizer_mode: decodeRandomizerMode(row.randomizer_mode),
    };
}

export const STARTER_LOCATION_NAME = 'Starter';

export async function listEncounterRolls(
    gameRunId: number,
): Promise<EncounterRollRow[]> {
    const db = await getGameDb();
    const rows = await db
        .selectFrom('encounter_rolls')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
    return rows.map((row) => ({
        ...row,
        status: decodeEncounterStatus(row.status),
    }));
}

export interface AddEncounterRollInput {
    gameRunId: number;
    locationName: string;
    pokemonName: string;
    status?: EncounterStatus;
}

export async function addEncounterRoll(
    input: AddEncounterRollInput,
): Promise<EncounterRollRow> {
    const db = await getGameDb();
    const row = {
        game_run_id: input.gameRunId,
        location_name: input.locationName,
        pokemon_name: input.pokemonName,
        rolled_as: input.pokemonName,
        status: encodeEncounterStatus(input.status ?? 'pending'),
        party_slot: NO_PARTY_SLOT,
    };
    const updateRes = await db
        .updateTable('encounter_rolls')
        .set(row)
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();

    if (updateRes.length > 0) {
        return { ...row, status: decodeEncounterStatus(row.status) };
    }
    await db.insertInto('encounter_rolls').values(row).execute();
    return { ...row, status: decodeEncounterStatus(row.status) };
}

export interface SetEncounterRollStatusInput {
    gameRunId: number;
    locationName: string;
    status: EncounterStatus;
}

export async function setEncounterRollStatus(
    input: SetEncounterRollStatusInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .updateTable('encounter_rolls')
        .set({ status: encodeEncounterStatus(input.status) })
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface SetEncounterPokemonInput {
    gameRunId: number;
    locationName: string;
    pokemonName: string;
}

export async function setEncounterPokemon(
    input: SetEncounterPokemonInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .updateTable('encounter_rolls')
        .set({ pokemon_name: input.pokemonName })
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface SetPartySlotInput {
    gameRunId: number;
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
    gameRunId: number;
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
    gameRunId: number;
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
    gameRunId: number,
): Promise<BossBattleProgressRow[]> {
    const db = await getGameDb();
    const rows = await db
        .selectFrom('boss_battle_progress')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
    return rows.map((row) => ({
        ...row,
        result: decodeBossBattleResult(row.result),
    }));
}

export interface SetBossBattleResultInput {
    gameRunId: number;
    battleName: string;
    result: BossBattleResult;
}

export async function setBossBattleResult(
    input: SetBossBattleResultInput,
): Promise<BossBattleProgressRow> {
    const db = await getGameDb();
    const row = {
        game_run_id: input.gameRunId,
        battle_name: input.battleName,
        result: encodeBossBattleResult(input.result),
    };

    const affectedRows = await db
        .updateTable('boss_battle_progress')
        .set({ result: encodeBossBattleResult(input.result) })
        .where('game_run_id', '=', input.gameRunId)
        .where('battle_name', '=', input.battleName)
        .execute();

    if (affectedRows.length === 0) {
        await db.insertInto('boss_battle_progress').values(row).execute();
    }

    return { ...row, result: decodeBossBattleResult(row.result) };
}

export interface ClearBossBattleResultInput {
    gameRunId: number;
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

const RANDOMIZER_MODE_CODES: Record<RandomizerMode, RandomizerModeCode> = {
    weighted: 'w',
    normalized: 'n',
    equal: 'e',
};

const ENCOUNTER_STATUS_CODES: Record<EncounterStatus, EncounterStatusCode> = {
    pending: 'p',
    caught: 'c',
    missed: 'm',
    eliminated: 'e',
};

const BOSS_BATTLE_RESULT_CODES: Record<
    BossBattleResult,
    BossBattleResultCode
> = {
    won: 'w',
    lost: 'l',
};

const VARIANT_NAMES: Record<GameVariant, string> = {
    s: 'scarlet',
    v: 'violet',
};

const encodeRandomizerMode = (value: RandomizerMode) =>
    encode(value, RANDOMIZER_MODE_CODES);
const decodeRandomizerMode = (code: RandomizerModeCode) =>
    decode(code, RANDOMIZER_MODE_CODES);
const encodeEncounterStatus = (value: EncounterStatus) =>
    encode(value, ENCOUNTER_STATUS_CODES);
const decodeEncounterStatus = (code: EncounterStatusCode) =>
    decode(code, ENCOUNTER_STATUS_CODES);
const encodeBossBattleResult = (value: BossBattleResult) =>
    encode(value, BOSS_BATTLE_RESULT_CODES);
const decodeBossBattleResult = (code: BossBattleResultCode) =>
    decode(code, BOSS_BATTLE_RESULT_CODES);

function encode<TValue extends string, TCode extends string>(
    value: TValue,
    codes: Record<TValue, TCode>,
): TCode {
    const code = codes[value];
    if (!code) {
        throw new Error(`Unexpected value: ${value}`);
    }
    return code;
}

function decode<TValue extends string, TCode extends string>(
    code: TCode,
    codes: Record<TValue, TCode>,
): TValue {
    const value = Object.keys(codes).find(
        (key) => codes[key as TValue] === code,
    );
    if (!value) {
        throw new Error(`Unexpected code: ${code}`);
    }
    return value as TValue;
}

function gameRunFromRow(row: GameRunsDb['game_runs']): GameRun {
    return {
        id: row.id,
        name: row.name,
        variant: row.variant,
        randomizer_mode: decodeRandomizerMode(row.randomizer_mode),
        settings: {
            pocoPathOcean: row.poco_path_ocean === 1,
        },
    };
}

function randomShortHash(): string {
    return crypto.randomUUID().slice(0, 8);
}

function assertGameNameFits(name: string): void {
    if (getGameNameByteLength(name) > GAME_NAME_MAX_BYTES) {
        throw new Error(
            `Game name must be ${GAME_NAME_MAX_BYTES} bytes or fewer`,
        );
    }
}

function getGameNameByteLength(name: string): number {
    return new TextEncoder().encode(name).length;
}