// A roll exists as soon as an encounter is rolled or picked; the DB has no NULL, so pending is explicit.
export type EncounterStatus = 'pending' | 'caught' | 'missed' | 'eliminated';
export type BooleanFlag = 0 | 1;
export type BossBattleResult = 'won' | 'lost';

export interface GameRunRow {
    id: string;
    variant: string;
    randomizer_mode: string;
    poco_path_ocean: BooleanFlag;
}

export interface EncounterRollRow {
    game_run_id: string;
    location_name: string;
    pokemon_name: string;
    status: EncounterStatus;
    // 0 means not in the party; 1..MAX_PARTY_SIZE is the party slot.
    party_slot: number;
}

export interface BossBattleProgressRow {
    game_run_id: string;
    battle_name: string;
    result: BossBattleResult;
}

export const MAX_PARTY_SIZE = 6;
export const NO_PARTY_SLOT = 0;

export interface GameRunsDb {
    game_runs: GameRunRow;
    encounter_rolls: EncounterRollRow;
    boss_battle_progress: BossBattleProgressRow;
}

// Bump whenever GAME_DB_SCHEMA_SQL changes; old versioned storage keys are left in place.
export const GAME_DB_SCHEMA_VERSION = 14;

export const GAME_DB_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE game_runs (id CHAR(64), variant CHAR(1), randomizer_mode CHAR(10), poco_path_ocean TINYINT)',
    'CREATE TABLE encounter_rolls (game_run_id CHAR(64), location_name CHAR(64), pokemon_name CHAR(64), status CHAR(10), party_slot TINYINT)',
    'CREATE TABLE boss_battle_progress (game_run_id CHAR(64), battle_name CHAR(64), result CHAR(4))',
];
