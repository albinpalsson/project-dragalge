import type { GameSettings } from '../db/game-db/queries';
import { DEFAULT_BAN_PRESET } from './ban-list';

export type SettingsPresetKey = 'fun' | 'challenging' | 'clean';

export interface FullGameSettingsValue extends GameSettings {
    banList: string[];
}

export function applyMonoRunRules(
    settings: FullGameSettingsValue,
): FullGameSettingsValue {
    if (!settings.monoRunEnabled) {
        return settings;
    }
    const hasStarterTypeMatch =
        ['fire', 'grass', 'water'].includes(settings.monoRunType) ||
        (settings.monoRunFutureEvolutions &&
            ['dark', 'ghost', 'fighting'].includes(settings.monoRunType));

    return {
        ...settings,
        teraRaids: 'unlimited',
        releaseStarterEnabled: !hasStarterTypeMatch,
    };
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
    monoRunEnabled: false,
    monoRunType: 'grass',
    monoRunFutureEvolutions: true,
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
            includeTeamStarBattles: true,
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
            banList: [...DEFAULT_BAN_PRESET, 'Garchomp', 'Salamance'].filter(
                (b) => b !== 'Skeledirge',
            ),
            banFullEvolutionLines: true,
            releaseStarterEnabled: true,
            showHelpfulTips: true,
            dupesClauseEnabled: true,
            teraRaids: 'none',
            includeTeamStarBattles: true,
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
