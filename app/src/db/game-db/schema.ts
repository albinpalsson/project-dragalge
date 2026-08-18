export interface GameRunRow {
    id: string;
    variant: string;
}

export interface GameRunsDb {
    game_runs: GameRunRow;
}

// Bump whenever GAME_DB_SCHEMA_SQL changes; old versioned storage keys are left in place.
export const GAME_DB_SCHEMA_VERSION = 1;

export const GAME_DB_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE game_runs (id CHAR(64), variant CHAR(1))',
];
