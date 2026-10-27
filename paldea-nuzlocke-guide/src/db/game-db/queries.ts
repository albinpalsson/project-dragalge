import type { RandomizerMode } from '../../randomizer';
import { getGameDb } from './client';
import {
    decodeEncounterStatus,
    encodeBossBattleResult,
    encodeEncounterStatus,
    encodeGameSettings,
} from './codecs';
import {
    allocateGameIdentity,
    assertGameNameFits,
    findGameRunRecord,
    insertBanListEntries,
    insertGameRunRecords,
    resolveGameRunId,
    selectBanListEntries,
    selectBossBattleProgress,
    selectEncounterRolls,
    selectGameRunRecords,
    toGameRun,
} from './internal';
import { NO_PARTY_SLOT } from './schema';

export { GAME_NAME_MAX_BYTES } from './internal';

// Callers address games by name. The game id is internal to this layer
// (see internal.ts) and never appears in these types or signatures.

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

export interface GameSettings {
    randomizerMode: RandomizerMode;
    dupesClauseEnabled: boolean;
    banFullEvolutionLines: boolean;
    releaseStarterEnabled: boolean;
    teraRaids: TeraRaidsSetting;
    showHelpfulTips: boolean;
    includeTeamStarBattles: boolean;
    showStrongTrainers: boolean;
    monoRunEnabled: boolean;
    monoRunType: string;
    monoRunFutureEvolutions: boolean;
}

export interface GameRun {
    createdAt: number;
    name: string;
    variant: string;
    settings: GameSettings;
}

export interface EncounterRollRow {
    location_name: string;
    pokemon_name: string;
    rolled_as: string;
    status: EncounterStatus;
    party_slot: number;
}

export interface BanListEntryRow {
    pokemon_name: string;
}

export interface BossBattleProgressRow {
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
    return `Game-${VARIANT_NAMES[variant]}-${randomShortHash()}`;
}

// Oldest game first.
export async function listGames(): Promise<GameRun[]> {
    const db = await getGameDb();
    return (await selectGameRunRecords(db)).map(toGameRun);
}

export async function getGameRun(
    gameName: string,
): Promise<GameRun | undefined> {
    const db = await getGameDb();
    const record = await findGameRunRecord(db, gameName);
    return record ? toGameRun(record) : undefined;
}

export async function getGameExportData(
    gameName: string,
): Promise<GameExportData> {
    const db = await getGameDb();
    const record = await findGameRunRecord(db, gameName);
    if (!record) {
        throw new Error('Game not found.');
    }
    const [banListEntries, encounterRolls, bossProgress] = await Promise.all([
        selectBanListEntries(db, record.id),
        selectEncounterRolls(db, record.id),
        selectBossBattleProgress(db, record.id),
    ]);
    return {
        game: toGameRun(record),
        banListEntries,
        encounterRolls,
        bossProgress,
    };
}

export interface CreateGameInput {
    name: string;
    variant: GameVariant;
    settings: GameSettings;
    banListNames: string[];
}

export async function createGame(input: CreateGameInput): Promise<GameRun> {
    const db = await getGameDb();
    const existing = await selectGameRunRecords(db);
    const identity = allocateGameIdentity(input.name, existing);

    const record = {
        ...identity,
        createdAt: Date.now(),
        variant: input.variant,
        settings: input.settings,
    };
    await insertGameRunRecords(db, [record]);
    await insertBanListEntries(
        db,
        record.id,
        input.banListNames.map((pokemonName) => ({
            pokemon_name: pokemonName,
        })),
    );
    return toGameRun(record);
}

export const STARTER_LOCATION_NAME = 'Starter';

export async function listBanListEntries(
    gameName: string,
): Promise<BanListEntryRow[]> {
    const db = await getGameDb();
    return selectBanListEntries(db, await resolveGameRunId(db, gameName));
}

export async function listEncounterRolls(
    gameName: string,
): Promise<EncounterRollRow[]> {
    const db = await getGameDb();
    return selectEncounterRolls(db, await resolveGameRunId(db, gameName));
}

export interface AddEncounterRollInput {
    gameName: string;
    locationName: string;
    pokemonName: string;
    status?: EncounterStatus;
}

export async function addEncounterRoll(
    input: AddEncounterRollInput,
): Promise<EncounterRollRow> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    const row = {
        location_name: input.locationName,
        pokemon_name: input.pokemonName,
        rolled_as: input.pokemonName,
        status: encodeEncounterStatus(input.status ?? 'pending'),
        party_slot: NO_PARTY_SLOT,
    };
    const updateRes = await db
        .updateTable('encounter_rolls')
        .set(row)
        .where('game_run_id', '=', gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();

    if (updateRes.length > 0) {
        return { ...row, status: decodeEncounterStatus(row.status) };
    }
    await db
        .insertInto('encounter_rolls')
        .values({ ...row, game_run_id: gameRunId })
        .execute();
    return { ...row, status: decodeEncounterStatus(row.status) };
}

export interface SkipEncounterInput {
    gameName: string;
    locationName: string;
}

// A skipped row is the only one with empty Pokemon names; it resolves the step without a species.
export async function skipEncounter(
    input: SkipEncounterInput,
): Promise<EncounterRollRow> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    const existing = await db
        .selectFrom('encounter_rolls')
        .selectAll()
        .where('game_run_id', '=', gameRunId)
        .where('location_name', '=', input.locationName)
        .executeTakeFirst();
    if (existing) {
        throw new Error(`Encounter already recorded: ${input.locationName}`);
    }
    const row = {
        location_name: input.locationName,
        pokemon_name: '',
        rolled_as: '',
        status: encodeEncounterStatus('skipped'),
        party_slot: NO_PARTY_SLOT,
    };
    await db
        .insertInto('encounter_rolls')
        .values({ ...row, game_run_id: gameRunId })
        .execute();
    return { ...row, status: 'skipped' };
}

export interface SetEncounterRollStatusInput {
    gameName: string;
    locationName: string;
    status: EncounterStatus;
}

export async function setEncounterRollStatus(
    input: SetEncounterRollStatusInput,
): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    await db
        .updateTable('encounter_rolls')
        .set({ status: encodeEncounterStatus(input.status) })
        .where('game_run_id', '=', gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface SetEncounterPokemonInput {
    gameName: string;
    locationName: string;
    pokemonName: string;
}

export async function setEncounterPokemon(
    input: SetEncounterPokemonInput,
): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    await db
        .updateTable('encounter_rolls')
        .set({ pokemon_name: input.pokemonName })
        .where('game_run_id', '=', gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface SetPartySlotInput {
    gameName: string;
    locationName: string;
    slot: number;
}

export async function setPartySlot(input: SetPartySlotInput): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    await db
        .updateTable('encounter_rolls')
        .set({ party_slot: input.slot })
        .where('game_run_id', '=', gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export interface ClearEncounterRollInput {
    gameName: string;
    locationName: string;
}

export async function clearEncounterRoll(
    input: ClearEncounterRollInput,
): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    await db
        .deleteFrom('encounter_rolls')
        .where('game_run_id', '=', gameRunId)
        .where('location_name', '=', input.locationName)
        .execute();
}

export async function deleteGame(gameName: string): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, gameName);
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

// Returns the stored (trimmed) name. Unlike createGame, a taken name is an
// error rather than being suffixed.
export async function renameGame(
    gameName: string,
    newName: string,
): Promise<string> {
    const name = newName.trim();
    if (name === '') {
        throw new Error('Game name cannot be empty');
    }
    assertGameNameFits(name);

    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, gameName);
    if (name === gameName) {
        return name;
    }
    if (await findGameRunRecord(db, name)) {
        throw new Error(`Game name already exists: ${name}`);
    }
    await db
        .updateTable('game_runs')
        .set({ name })
        .where('id', '=', gameRunId)
        .execute();
    return name;
}

export interface UpdateGameRunSettingsInput {
    gameName: string;
    settings: GameSettings;
    banListNames: string[];
}

export async function updateGameRunSettings(
    input: UpdateGameRunSettingsInput,
): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    await db
        .updateTable('game_runs')
        .set(encodeGameSettings(input.settings))
        .where('id', '=', gameRunId)
        .execute();

    await db
        .deleteFrom('ban_list_entries')
        .where('game_run_id', '=', gameRunId)
        .execute();

    await insertBanListEntries(
        db,
        gameRunId,
        input.banListNames.map((pokemonName) => ({
            pokemon_name: pokemonName,
        })),
    );
}

export async function listBossBattleProgress(
    gameName: string,
): Promise<BossBattleProgressRow[]> {
    const db = await getGameDb();
    return selectBossBattleProgress(db, await resolveGameRunId(db, gameName));
}

export interface SetBossBattleResultInput {
    gameName: string;
    battleName: string;
    result: BossBattleResult;
}

export async function setBossBattleResult(
    input: SetBossBattleResultInput,
): Promise<BossBattleProgressRow> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    const encodedResult = encodeBossBattleResult(input.result);

    const affectedRows = await db
        .updateTable('boss_battle_progress')
        .set({ result: encodedResult })
        .where('game_run_id', '=', gameRunId)
        .where('battle_name', '=', input.battleName)
        .execute();

    if (affectedRows.length === 0) {
        await db
            .insertInto('boss_battle_progress')
            .values({
                game_run_id: gameRunId,
                battle_name: input.battleName,
                result: encodedResult,
            })
            .execute();
    }

    return { battle_name: input.battleName, result: input.result };
}

export interface ClearBossBattleResultInput {
    gameName: string;
    battleName: string;
}

export async function clearBossBattleResult(
    input: ClearBossBattleResultInput,
): Promise<void> {
    const db = await getGameDb();
    const gameRunId = await resolveGameRunId(db, input.gameName);
    await db
        .deleteFrom('boss_battle_progress')
        .where('game_run_id', '=', gameRunId)
        .where('battle_name', '=', input.battleName)
        .execute();
}

const VARIANT_NAMES: Record<GameVariant, string> = {
    s: 'scarlet',
    v: 'violet',
};

function randomShortHash(): string {
    return crypto.randomUUID().slice(0, 8);
}
