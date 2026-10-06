import type { GameSettings } from '../db/game-db/queries';
import { DEFAULT_BAN_PRESET, PSEUDO_LEGENDARY_PRESET } from './ban-list';

export type SettingsPresetKey = 'fun' | 'challenging' | 'clean';

export interface FullGameSettingsValue extends GameSettings {
    banList: string[];
}

export interface GameSettingsPreset {
    key: SettingsPresetKey;
    label: string;
    description: string;
    defaults: FullGameSettingsValue;
}

const CLEAN_FULL_SETTINGS: FullGameSettingsValue = {
    randomizerMode: 'weighted',
    dupesClauseEnabled: false,
    banFullEvolutionLines: false,
    banList: [],
    releaseStarterEnabled: false,
    teraRaids: 'unlimited',
    showHelpfulTips: false,
    includeTeamStarBattles: false,
};

export const SETTINGS_PRESETS: readonly GameSettingsPreset[] = [
    {
        key: 'fun',
        label: 'Fun',
        description: 'Balanced defaults for a smooth first run.',
        defaults: {
            ...CLEAN_FULL_SETTINGS,
            randomizerMode: 'normalized',
            dupesClauseEnabled: true,
            banFullEvolutionLines: true,
            teraRaids: 'single',
            includeTeamStarBattles: false,
            showHelpfulTips: true,
        },
    },
    {
        key: 'challenging',
        label: 'Challenging',
        description: 'Stricter rules and a broader default ban set.',
        defaults: {
            ...CLEAN_FULL_SETTINGS,
            randomizerMode: 'weighted',
            banList: [...DEFAULT_BAN_PRESET, ...PSEUDO_LEGENDARY_PRESET],
            banFullEvolutionLines: true,
            releaseStarterEnabled: true,
            showHelpfulTips: true,
            dupesClauseEnabled: true,
            teraRaids: 'none',
            includeTeamStarBattles: false,
        },
    },
    {
        key: 'clean',
        label: 'Clean',
        description: 'Minimal restrictions.',
        defaults: CLEAN_FULL_SETTINGS,
    },
];

export function getSettingsPreset(key: SettingsPresetKey): GameSettingsPreset {
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
