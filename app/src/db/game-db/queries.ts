import type { RandomizerMode } from '../../randomizer';
import { getGameDb } from './client';
import type {
    EncounterRollRow,
    EncounterStatus,
    GameRunRow,
} from './schema';

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

export async function getGameRun(
    gameRunId: string,
): Promise<GameRunRow | undefined> {
    const db = await getGameDb();
    return db
        .selectFrom('game_runs')
        .selectAll()
        .where('id', '=', gameRunId)
        .executeTakeFirst();
}

export interface CreateGameInput {
    name: string;
    variant: GameVariant;
    randomizerMode: RandomizerMode;
}

export async function createGame(
    input: CreateGameInput,
): Promise<GameRunRow> {
    const db = await getGameDb();
    const existing = await listGames();
    const existingIds = new Set(existing.map((row) => row.id));

    const baseName = input.name.trim();
    let newName = baseName;
    let count = 1;
    while (existingIds.has(newName)) {
        newName = `${baseName}-${count++}`;
    }

    const row = {
        id: newName,
        variant: input.variant,
        randomizer_mode: input.randomizerMode,
    };
    await db.insertInto('game_runs').values(row).execute();
    return row;
}

export const STARTER_LOCATION_ID = 'starter-choice';

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
    locationId: string;
    pokemonId: number;
    status?: EncounterStatus;
}

export async function addEncounterRoll(
    input: AddEncounterRollInput,
): Promise<EncounterRollRow> {
    const db = await getGameDb();
    const row: EncounterRollRow = {
        game_run_id: input.gameRunId,
        location_id: input.locationId,
        pokemon_id: input.pokemonId,
        status: input.status ?? 'pending',
    };
    await db.insertInto('encounter_rolls').values(row).execute();
    return row;
}

export interface SetEncounterRollStatusInput {
    gameRunId: string;
    locationId: string;
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
        .where('location_id', '=', input.locationId)
        .execute();
}

export interface ClearEncounterRollInput {
    gameRunId: string;
    locationId: string;
}

export async function clearEncounterRoll(
    input: ClearEncounterRollInput,
): Promise<void> {
    const db = await getGameDb();
    await db
        .deleteFrom('encounter_rolls')
        .where('game_run_id', '=', input.gameRunId)
        .where('location_id', '=', input.locationId)
        .execute();
}
