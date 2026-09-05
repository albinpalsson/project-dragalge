// A roll exists as soon as an encounter is rolled or picked; the DB has no NULL, so pending is explicit.
export type EncounterStatus = 'pending' | 'caught' | 'missed' | 'eliminated';

export interface GameRunRow {
    id: string;
    variant: string;
    randomizer_mode: string;
}

export interface EncounterRollRow {
    game_run_id: string;
    location_id: string;
    pokemon_id: number;
    status: EncounterStatus;
}

export interface GameRunsDb {
    game_runs: GameRunRow;
    encounter_rolls: EncounterRollRow;
}

// Bump whenever GAME_DB_SCHEMA_SQL changes; old versioned storage keys are left in place.
export const GAME_DB_SCHEMA_VERSION = 6;

export const GAME_DB_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE game_runs (id CHAR(64), variant CHAR(1), randomizer_mode CHAR(10))',
    'CREATE TABLE encounter_rolls (game_run_id CHAR(64), location_id CHAR(32), pokemon_id INT, status CHAR(10))',
];
