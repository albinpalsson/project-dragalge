export type BooleanFlag = 0 | 1;
export type RandomizerModeCode = 'w' | 'n' | 'e';
export type EncounterStatusCode = 'p' | 'c' | 'm' | 'e' | 'r' | 's';
export type TeraRaidsCode = 'n' | 's' | 'u';
export type BossBattleResultCode = 'w' | 'l';

export const MAX_PARTY_SIZE = 6;
export const NO_PARTY_SLOT = 0;

interface GameRunDbRow {
    id: number;
    name: string;
    variant: string;
    randomizer_mode: RandomizerModeCode;
    dupes_clause_enabled: BooleanFlag;
    ban_full_evolution_lines: BooleanFlag;
    release_starter_enabled: BooleanFlag;
    tera_raids: TeraRaidsCode;
    show_helpful_tips: BooleanFlag;
    include_team_star_battles: BooleanFlag;
    show_strong_trainers: BooleanFlag;
    mono_run_enabled: BooleanFlag;
    mono_run_type: string;
    mono_run_future_evolutions: BooleanFlag;
}

interface BanListEntryDbRow {
    game_run_id: number;
    pokemon_name: string;
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
    ban_list_entries: BanListEntryDbRow;
    encounter_rolls: EncounterRollDbRow;
    boss_battle_progress: BossBattleProgressDbRow;
}

// Bump whenever GAME_DB_SCHEMA_SQL changes; old versioned storage keys are left in place.
export const GAME_DB_SCHEMA_VERSION = 25;

export const GAME_DB_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE game_runs (id TINYINT, name CHAR(128), variant CHAR(1), randomizer_mode CHAR(1), dupes_clause_enabled TINYINT, ban_full_evolution_lines TINYINT, release_starter_enabled TINYINT, tera_raids CHAR(1), show_helpful_tips TINYINT, include_team_star_battles TINYINT, show_strong_trainers TINYINT, mono_run_enabled TINYINT, mono_run_type CHAR(12), mono_run_future_evolutions TINYINT)',
    'CREATE TABLE ban_list_entries (game_run_id TINYINT, pokemon_name CHAR(32))',
    'CREATE TABLE encounter_rolls (game_run_id TINYINT, location_name CHAR(32), pokemon_name CHAR(32), rolled_as CHAR(32), status CHAR(1), party_slot TINYINT)',
    'CREATE TABLE boss_battle_progress (game_run_id TINYINT, battle_name CHAR(44), result CHAR(1))',
];
