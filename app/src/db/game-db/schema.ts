export interface GameRunRow {
    id: string;
    variant: string;
}

export interface CaughtPokemonRow {
    game_run_id: string;
    pokemon_id: number;
    location_id: string;
}

export interface GameRunsDb {
    game_runs: GameRunRow;
    caught_pokemon: CaughtPokemonRow;
}

// Bump whenever GAME_DB_SCHEMA_SQL changes; old versioned storage keys are left in place.
export const GAME_DB_SCHEMA_VERSION = 5;

export const GAME_DB_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE game_runs (id CHAR(64), variant CHAR(1))',
    'CREATE TABLE caught_pokemon (game_run_id CHAR(64), pokemon_id INT, location_id CHAR(32))',
];
