import type { GameSettings } from '../db/game-db/queries';
import { DEFAULT_RANDOMIZER_MODE } from '../randomizer';
import { DEFAULT_BAN_PRESET, PSEUDO_LEGENDARY_PRESET } from './ban-list';

export type SettingsPresetKey = 'fun' | 'challenging' | 'clean';

export interface FullGameSettingsValue
    extends Omit<GameSettings, 'pocoPathOcean'> {
    banList: string[];
}

export interface GameSettingsPreset {
    key: SettingsPresetKey;
    label: string;
    description: string;
    defaults: FullGameSettingsValue;
}

const DEFAULT_FULL_SETTINGS: FullGameSettingsValue = {
    randomizerMode: DEFAULT_RANDOMIZER_MODE,
    dupesClauseEnabled: false,
    banFullEvolutionLines: true,
    banList: [...DEFAULT_BAN_PRESET],
    releaseStarterEnabled: false,
    teraRaids: 'none',
    showHelpfulTips: false,
    includeTeamStarBattles: false,
};

export const SETTINGS_PRESETS: readonly GameSettingsPreset[] = [
    {
        key: 'fun',
        label: 'Fun',
        description: 'Balanced defaults for a smooth first run.',
        defaults: DEFAULT_FULL_SETTINGS,
    },
    {
        key: 'challenging',
        label: 'Challenging',
        description: 'Stricter rules and a broader default ban set.',
        defaults: {
            ...DEFAULT_FULL_SETTINGS,
            randomizerMode: 'weighted',
            dupesClauseEnabled: true,
            banList: [...DEFAULT_BAN_PRESET, ...PSEUDO_LEGENDARY_PRESET],
            releaseStarterEnabled: true,
            showHelpfulTips: true,
            includeTeamStarBattles: true,
            teraRaids: 'single',
        },
    },
    {
        key: 'clean',
        label: 'Clean',
        description: 'Minimal restrictions with an empty custom ban list.',
        defaults: {
            ...DEFAULT_FULL_SETTINGS,
            randomizerMode: 'equal',
            banFullEvolutionLines: false,
            banList: [],
        },
    },
];

export function getSettingsPreset(
    key: SettingsPresetKey,
): GameSettingsPreset {
    return (
        SETTINGS_PRESETS.find((preset) => preset.key === key) ??
        SETTINGS_PRESETS[0]
    );
}

export function cloneSettings(
    value: FullGameSettingsValue,
): FullGameSettingsValue {
    return {
        ...value,
        banList: [...value.banList],
    };
}
