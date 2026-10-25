import type { RandomizerMode } from '../../randomizer';
import type {
    BossBattleResult,
    EncounterStatus,
    GameSettings,
    TeraRaidsSetting,
} from './queries';
import type {
    BooleanFlag,
    BossBattleResultCode,
    EncounterStatusCode,
    GameRunsDb,
    RandomizerModeCode,
    TeraRaidsCode,
} from './schema';

// The encoded storage columns for GameSettings: every game_runs column except identity.
export type EncodedGameSettings = Omit<
    GameRunsDb['game_runs'],
    'id' | 'created_at' | 'name' | 'variant'
>;

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

export function encodeGameSettings(
    settings: GameSettings,
): EncodedGameSettings {
    return {
        randomizer_mode: encodeRandomizerMode(settings.randomizerMode),
        dupes_clause_enabled: encodeFlag(settings.dupesClauseEnabled),
        ban_full_evolution_lines: encodeFlag(settings.banFullEvolutionLines),
        release_starter_enabled: encodeFlag(settings.releaseStarterEnabled),
        tera_raids: encodeTeraRaids(settings.teraRaids),
        show_helpful_tips: encodeFlag(settings.showHelpfulTips),
        include_team_star_battles: encodeFlag(settings.includeTeamStarBattles),
        show_strong_trainers: encodeFlag(settings.showStrongTrainers),
        mono_run_enabled: encodeFlag(settings.monoRunEnabled),
        mono_run_type: settings.monoRunType,
        mono_run_future_evolutions: encodeFlag(
            settings.monoRunFutureEvolutions,
        ),
    };
}

export function decodeGameSettings(row: EncodedGameSettings): GameSettings {
    return {
        randomizerMode: decodeRandomizerMode(row.randomizer_mode),
        dupesClauseEnabled: decodeFlag(row.dupes_clause_enabled),
        banFullEvolutionLines: decodeFlag(row.ban_full_evolution_lines),
        releaseStarterEnabled: decodeFlag(row.release_starter_enabled),
        teraRaids: decodeTeraRaids(row.tera_raids),
        showHelpfulTips: decodeFlag(row.show_helpful_tips),
        includeTeamStarBattles: decodeFlag(row.include_team_star_battles),
        showStrongTrainers: decodeFlag(row.show_strong_trainers),
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
