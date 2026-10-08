import type { RandomizerMode } from '../../randomizer';
import type { Database } from '@pokedb2/query-builder';
import { getGameDb } from './client';
import type {
    BooleanFlag,
    BossBattleResultCode,
    EncounterStatusCode,
    GameRunsDb,
    RandomizerModeCode,
    TeraRaidsCode,
} from './schema';
import { NO_PARTY_SLOT } from './schema';

export type GameVariant = 's' | 'v';
export type EncounterStatus =
    | 'pending'
    | 'caught'
    | 'missed'
    | 'eliminated'
    | 'released'
    | 'skipped';
export type TeraRaidsSetting = 'none' | 'single' | 'unlimited';
export type BossBattleResult = 'won' | 'lost';
export const GAME_NAME_MAX_BYTES = 128;

export interface GameSettings {
    randomizerMode: RandomizerMode;
    dupesClauseEnabled: boolean;
    banFullEvolutionLines: boolean;
    releaseStarterEnabled: boolean;
    teraRaids: TeraRaidsSetting;
    showHelpfulTips: boolean;
    includeTeamStarBattles: boolean;
    monoRunEnabled: boolean;
    monoRunType: string;
    monoRunFutureEvolutions: boolean;
}

// The encoded storage columns for GameSettings: every game_runs column except identity.
type EncodedGameSettings = Omit<
    GameRunsDb['game_runs'],
    'id' | 'name' | 'variant'
>;

export interface GameRun {
    id: number;
    name: string;
    variant: string;
    settings: GameSettings;
}

export interface EncounterRollRow {
    game_run_id: number;
    location_name: string;
    pokemon_name: string;
    rolled_as: string;
    status: EncounterStatus;
    party_slot: number;
}

export interface BanListEntryRow {
    game_run_id: number;
    pokemon_name: string;
}

export interface BossBattleProgressRow {
    game_run_id: number;
    battle_name: string;
    result: BossBattleResult;
}

export interface GameExportData {
    game: GameRun;
    banListEntries: BanListEntryRow[];
    encounterRolls: EncounterRollRow[];
    bossProgress: BossBattleProgressRow[];
}

export function generateDefaultGameName(variant: GameVariant): string {
    return `game-${VARIANT_NAMES[variant]}-${randomShortHash()}`;
}

export async function listGames(): Promise<GameRun[]> {
    const db = await getGameDb();
    return selectGameRuns(db);
}

export async function selectGameRuns(
    db: Database<GameRunsDb>,
): Promise<GameRun[]> {
    const rows = await db.selectFrom('game_runs').selectAll().execute();
    return rows.map(gameRunFromRow);
}

export async function getGameExportData(
    gameRunId: number,
): Promise<GameExportData> {
    const games = await listGames();
    const game = games.find((row) => row.id === gameRunId);
    if (!game) {
        throw new Error('Game not found.');
    }
    const [banListEntries, encounterRolls, bossProgress] = await Promise.all([
        listBanListEntries(gameRunId),
        listEncounterRolls(gameRunId),
        listBossBattleProgress(gameRunId),
    ]);
    return { game, banListEntries, encounterRolls, bossProgress };
}

export async function insertGameRuns(
    db: Database<GameRunsDb>,
    rows: readonly GameRun[],
): Promise<void> {
    if (rows.length === 0) {
        return;
    }
    await db
        .insertInto('game_runs')
        .values(
            rows.map((row) => ({
                id: row.id,
                name: row.name,
                variant: row.variant,
                ...encodeGameSettings(row.settings),
            })),
        )
        .execute();
}

export async function insertBanListEntries(
    db: Database<GameRunsDb>,
    rows: readonly BanListEntryRow[],
): Promise<void> {
    if (rows.length === 0) {
        return;
    }
    await db
        .insertInto('ban_list_entries')
        .values([...rows])
        .execute();
}

export async function insertEncounterRolls(
    db: Database<GameRunsDb>,
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
                status: encodeEncounterStatus(row.status),
            })),
        )
        .execute();
}

export async function insertBossBattleProgress(
    db: Database<GameRunsDb>,
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
                result: encodeBossBattleResult(row.result),
            })),
        )
        .execute();
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
    settings: GameSettings;
    banListNames: string[];
}

export async function createGame(input: CreateGameInput): Promise<GameRun> {
    const db = await getGameDb();
    const existing = await listGames();
    const identity = allocateGameIdentity(input.name, existing);

    const game: GameRun = {
        ...identity,
        variant: input.variant,
        settings: input.settings,
    };
    await insertGameRuns(db, [game]);
    await insertBanListEntries(
        db,
        input.banListNames.map((pokemonName) => ({
            game_run_id: game.id,
            pokemon_name: pokemonName,
        })),
    );
    return game;
}

export function allocateGameIdentity(
    requestedName: string,
    existing: readonly GameRun[],
): Pick<GameRun, 'id' | 'name'> {
    const baseName = requestedName.trim();
    assertGameNameFits(baseName);

    const names = new Set(existing.map((game) => game.name));
    let name = baseName;
    let suffix = 1;
    while (names.has(name)) {
        name = `${baseName}-${suffix++}`;
    }

    const ids = new Set(existing.map((game) => game.id));
    let id = 1;
    while (ids.has(id) && id <= 255) {
        id += 1;
    }
    if (id > 255) {
        throw new Error('Cannot create more than 255 games');
    }
    return { id, name };
}

export const STARTER_LOCATION_NAME = 'Starter';

export async function listBanListEntries(
    gameRunId: number,
): Promise<BanListEntryRow[]> {
    const db = await getGameDb();
    return selectBanListEntries(gameRunId, db);
}

export async function selectBanListEntries(
    gameRunId: number,
    db: Database<GameRunsDb>,
): Promise<BanListEntryRow[]> {
    return db
        .selectFrom('ban_list_entries')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .execute();
}

export async function listEncounterRolls(
    gameRunId: number,
): Promise<EncounterRollRow[]> {
    const db = await getGameDb();
    return selectEncounterRolls(gameRunId, db);
}

export async function selectEncounterRolls(
    gameRunId: number,
    db: Database<GameRunsDb>,
) {
    return (
        await db
            .selectFrom('encounter_rolls')
            .selectAll()
            .where('game_run_id', '=', gameRunId)
            .execute()
    ).map((row) => ({
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

export interface SkipEncounterInput {
    gameRunId: number;
    locationName: string;
}

// A skipped row is the only one with empty Pokemon names; it resolves the step without a species.
export async function skipEncounter(
    input: SkipEncounterInput,
): Promise<EncounterRollRow> {
    const db = await getGameDb();
    const existing = await db
        .selectFrom('encounter_rolls')
        .selectAll()
        .where('game_run_id', '=', input.gameRunId)
        .where('location_name', '=', input.locationName)
        .executeTakeFirst();
    if (existing) {
        throw new Error(`Encounter already recorded: ${input.locationName}`);
    }
    const row = {
        game_run_id: input.gameRunId,
        location_name: input.locationName,
        pokemon_name: '',
        rolled_as: '',
        status: encodeEncounterStatus('skipped'),
        party_slot: NO_PARTY_SLOT,
    };
    await db.insertInto('encounter_rolls').values(row).execute();
    return { ...row, status: 'skipped' };
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

export async function deleteGame(gameRunId: number): Promise<void> {
    const db = await getGameDb();
    // The db package has no cascade, so child rows go first.
    await db
        .deleteFrom('encounter_rolls')
        .where('game_run_id', '=', gameRunId)
        .execute();
    await db
        .deleteFrom('ban_list_entries')
        .where('game_run_id', '=', gameRunId)
        .execute();
    await db
        .deleteFrom('boss_battle_progress')
        .where('game_run_id', '=', gameRunId)
        .execute();
    await db.deleteFrom('game_runs').where('id', '=', gameRunId).execute();
}

export interface UpdateGameRunSettingsInput {
    gameRunId: number;
    settings: GameSettings;
    banListNames: string[];
}

export async function updateGameRunSettings(
    input: UpdateGameRunSettingsInput,
): Promise<void> {
    const db = await getGameDb();
    const s = input.settings;
    await db
        .updateTable('game_runs')
        .set({
            randomizer_mode: encodeRandomizerMode(s.randomizerMode),
            dupes_clause_enabled: encodeFlag(s.dupesClauseEnabled),
            ban_full_evolution_lines: encodeFlag(s.banFullEvolutionLines),
            release_starter_enabled: encodeFlag(s.releaseStarterEnabled),
            tera_raids: encodeTeraRaids(s.teraRaids),
            show_helpful_tips: encodeFlag(s.showHelpfulTips),
            include_team_star_battles: encodeFlag(s.includeTeamStarBattles),
            mono_run_enabled: encodeFlag(s.monoRunEnabled),
            mono_run_type: s.monoRunType,
            mono_run_future_evolutions: encodeFlag(s.monoRunFutureEvolutions),
        })
        .where('id', '=', input.gameRunId)
        .execute();

    await db
        .deleteFrom('ban_list_entries')
        .where('game_run_id', '=', input.gameRunId)
        .execute();

    await insertBanListEntries(
        db,
        input.banListNames.map((pokemonName) => ({
            game_run_id: input.gameRunId,
            pokemon_name: pokemonName,
        })),
    );
}

export async function listBossBattleProgress(
    gameRunId: number,
): Promise<BossBattleProgressRow[]> {
    const db = await getGameDb();
    return selectBossBattleProgress(gameRunId, db);
}

export async function selectBossBattleProgress(
    gameRunId: number,
    db: Database<GameRunsDb>,
): Promise<BossBattleProgressRow[]> {
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
    released: 'r',
    skipped: 's',
};

const TERA_RAIDS_CODES: Record<TeraRaidsSetting, TeraRaidsCode> = {
    none: 'n',
    single: 's',
    unlimited: 'u',
};

const BOSS_BATTLE_RESULT_CODES: Record<BossBattleResult, BossBattleResultCode> =
    {
        won: 'w',
        lost: 'l',
    };

const VARIANT_NAMES: Record<GameVariant, string> = {
    s: 'scarlet',
    v: 'violet',
};

export const encodeRandomizerMode = (value: RandomizerMode) =>
    encode(value, RANDOMIZER_MODE_CODES);
export const decodeRandomizerMode = (code: RandomizerModeCode) =>
    decode(code, RANDOMIZER_MODE_CODES);
export const encodeEncounterStatus = (value: EncounterStatus) =>
    encode(value, ENCOUNTER_STATUS_CODES);
export const decodeEncounterStatus = (code: EncounterStatusCode) =>
    decode(code, ENCOUNTER_STATUS_CODES);
export const encodeTeraRaids = (value: TeraRaidsSetting) =>
    encode(value, TERA_RAIDS_CODES);
export const decodeTeraRaids = (code: TeraRaidsCode) =>
    decode(code, TERA_RAIDS_CODES);
export const encodeBossBattleResult = (value: BossBattleResult) =>
    encode(value, BOSS_BATTLE_RESULT_CODES);
export const decodeBossBattleResult = (code: BossBattleResultCode) =>
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
    const { id, name, variant, ...encodedSettings } = row;
    return { id, name, variant, settings: decodeGameSettings(encodedSettings) };
}

function encodeGameSettings(settings: GameSettings): EncodedGameSettings {
    return {
        randomizer_mode: encodeRandomizerMode(settings.randomizerMode),
        dupes_clause_enabled: encodeFlag(settings.dupesClauseEnabled),
        ban_full_evolution_lines: encodeFlag(settings.banFullEvolutionLines),
        release_starter_enabled: encodeFlag(settings.releaseStarterEnabled),
        tera_raids: encodeTeraRaids(settings.teraRaids),
        show_helpful_tips: encodeFlag(settings.showHelpfulTips),
        include_team_star_battles: encodeFlag(settings.includeTeamStarBattles),
        mono_run_enabled: encodeFlag(settings.monoRunEnabled),
        mono_run_type: settings.monoRunType,
        mono_run_future_evolutions: encodeFlag(
            settings.monoRunFutureEvolutions,
        ),
    };
}

function decodeGameSettings(row: EncodedGameSettings): GameSettings {
    return {
        randomizerMode: decodeRandomizerMode(row.randomizer_mode),
        dupesClauseEnabled: decodeFlag(row.dupes_clause_enabled),
        banFullEvolutionLines: decodeFlag(row.ban_full_evolution_lines),
        releaseStarterEnabled: decodeFlag(row.release_starter_enabled),
        teraRaids: decodeTeraRaids(row.tera_raids),
        showHelpfulTips: decodeFlag(row.show_helpful_tips),
        includeTeamStarBattles: decodeFlag(row.include_team_star_battles),
        monoRunEnabled: decodeFlag(row.mono_run_enabled),
        monoRunType: row.mono_run_type,
        monoRunFutureEvolutions: decodeFlag(row.mono_run_future_evolutions),
    };
}

function encodeFlag(value: boolean): BooleanFlag {
    return value ? 1 : 0;
}

function decodeFlag(value: BooleanFlag): boolean {
    return value === 1;
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
