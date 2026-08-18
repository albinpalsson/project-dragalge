import { getGameDb } from './client';
import type { GameRunRow } from './schema';

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

export interface CreateGameInput {
    name: string;
    variant: GameVariant;
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

    const row= { id: newName, variant: input.variant };
    await db.insertInto('game_runs').values(row).execute();
    return row;
}
