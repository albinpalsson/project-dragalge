export type BooleanFlag = 0 | 1;
export type RandomizerModeCode = 'w' | 'n' | 'e';
export type EncounterStatusCode = 'p' | 'c' | 'm' | 'e';
export type BossBattleResultCode = 'w' | 'l';

export const MAX_PARTY_SIZE = 6;
export const NO_PARTY_SLOT = 0;

interface GameRunDbRow {
    id: number;
    name: string;
    variant: string;
    randomizer_mode: RandomizerModeCode;
    poco_path_ocean: BooleanFlag;
}

interface EncounterRollDbRow {
    game_run_id: number;
    location_name: string;
    pokemon_name: string;
    rolled_as: string;
    status: EncounterStatusCode;
    party_slot: number;
}

interface BossBattleProgressDbRow {
    game_run_id: number;
    battle_name: string;
    result: BossBattleResultCode;
}

export interface GameRunsDb {
    game_runs: GameRunDbRow;
    encounter_rolls: EncounterRollDbRow;
    boss_battle_progress: BossBattleProgressDbRow;
}

// Bump whenever GAME_DB_SCHEMA_SQL changes; old versioned storage keys are left in place.
export const GAME_DB_SCHEMA_VERSION = 17;

export const GAME_DB_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE game_runs (id TINYINT, name CHAR(128), variant CHAR(1), randomizer_mode CHAR(1), poco_path_ocean TINYINT)',
    'CREATE TABLE encounter_rolls (game_run_id TINYINT, location_name CHAR(32), pokemon_name CHAR(32), rolled_as CHAR(32), status CHAR(1), party_slot TINYINT)',
    'CREATE TABLE boss_battle_progress (game_run_id TINYINT, battle_name CHAR(44), result CHAR(1))',
];
