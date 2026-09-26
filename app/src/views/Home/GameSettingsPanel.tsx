import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../components/Badge';
import { Checkbox } from '../../components/Checkbox';
import { PokemonAutocomplete } from '../../components/PokemonAutocomplete';
import { Select } from '../../components/Select';
import { RANDOMIZER_MODE_OPTIONS } from '../../randomizer';
import type { FullGameSettingsValue } from '../../utils/game-setting-presets';

interface Preset {
    label: string;
    names: readonly string[];
    disabled?: boolean;
    title?: string;
}

interface GameSettingsPanelProps {
    value: FullGameSettingsValue;
    onChange: (value: FullGameSettingsValue) => void;
    suggestions: readonly string[];
    presets: readonly Preset[];
}

export function GameSettingsPanel({
    value,
    onChange,
    suggestions,
    presets,
}: GameSettingsPanelProps) {
    const banListSet = new Set(value.banList);

    const addNames = (names: readonly string[]) => {
        onChange({
            ...value,
            banList: [
                ...value.banList,
                ...names.filter((name) => !banListSet.has(name)),
            ],
        });
    };

    return (
        <div className={panel}>
            <Select
                label="Randomizer"
                value={value.randomizerMode}
                onChange={(randomizerMode) =>
                    onChange({
                        ...value,
                        randomizerMode: randomizerMode as
                            FullGameSettingsValue['randomizerMode'],
                    })
                }
                options={[...RANDOMIZER_MODE_OPTIONS]}
            />
            <Checkbox
                label="Dupes clause"
                checked={value.dupesClauseEnabled}
                title="Prevents using multiple Pokémon from the same evolution line."
                onChange={(dupesClauseEnabled) =>
                    onChange({ ...value, dupesClauseEnabled })
                }
            />
            <Checkbox
                label="Release starter"
                checked={value.releaseStarterEnabled}
                onChange={(releaseStarterEnabled) =>
                    onChange({ ...value, releaseStarterEnabled })
                }
            />
            <section className={section}>
            <h3>Ban list</h3>
            <Checkbox
                label="Ban full evolution lines"
                checked={value.banFullEvolutionLines}
                title="When enabled, manual bans and presets also ban every Pokémon in each evolution line."
                onChange={(banFullEvolutionLines) =>
                    onChange({ ...value, banFullEvolutionLines })
                }
            />
            <div className={presetList}>
                {presets.map((preset) => {
                    const addsNoNewNames =
                        preset.names.length > 0 &&
                        preset.names.every((name) => banListSet.has(name));
                    const isDisabled = Boolean(preset.disabled || addsNoNewNames);
                    const title = preset.title
                        ? preset.title
                        : addsNoNewNames
                          ? 'All Pokemon in this preset are already in the ban list.'
                          : `Add ${preset.label} to the ban list`;

                    return (
                        <BadgeButton
                            key={preset.label}
                            onClick={() => addNames(preset.names)}
                            disabled={isDisabled}
                            title={title}
                        >
                            {preset.label}
                        </BadgeButton>
                    );
                })}
            </div>
            <PokemonAutocomplete
                suggestions={suggestions}
                onAdd={(name) => addNames([name])}
            />
            <div className={banList}>
                {value.banList.map((name) => (
                    <BadgeButton
                        key={name}
                        onClick={() =>
                            onChange({
                                ...value,
                                banList: value.banList.filter((item) => item !== name),
                            })
                        }
                        ariaLabel={`Remove ${name} from ban list`}
                        title={`Remove ${name}`}
                    >
                        {name} ×
                    </BadgeButton>
                ))}
            </div>
            <Select
                label="Tera raids"
                value={value.teraRaids}
                onChange={(teraRaids) =>
                    onChange({
                        ...value,
                        teraRaids: teraRaids as FullGameSettingsValue['teraRaids'],
                    })
                }
                options={[
                    { value: 'none', label: 'None' },
                    { value: 'single', label: 'Single encounter per ★ rating' },
                    { value: 'unlimited', label: 'Unlimited' },
                ]}
            />
            <Checkbox
                label="Show helpful support milestones"
                checked={value.showHelpfulTips}
                title="Milestones like access to nature changing mints, EV boosting bands and other useful items will appear in the game view."
                onChange={(showHelpfulTips) =>
                    onChange({ ...value, showHelpfulTips })
                }
            />
            <Checkbox
                label="Include Team Star battles"
                checked={value.includeTeamStarBattles}
                onChange={(includeTeamStarBattles) =>
                    onChange({ ...value, includeTeamStarBattles })
                }
            />
            </section>
        </div>
    );
}

const panel = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const section = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const presetList = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
`;

const banList = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    min-height: 2.8rem;
`;
