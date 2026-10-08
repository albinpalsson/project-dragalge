import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../components/Badge';
import { Checkbox } from '../../components/Checkbox';
import { Modal } from '../../components/Modal';
import { PokemonAutocomplete } from '../../components/PokemonAutocomplete';
import { RandomizerModesGuide } from '../../components/RandomizerModesGuide';
import { Select } from '../../components/Select';
import { RANDOMIZER_MODE_OPTIONS } from '../../randomizer';
import { POKEMON_TYPES } from '../../utils/pokemon-types';
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
    const [isModesGuideOpen, setModesGuideOpen] = useState(false);
    const monoRunTypeOptions = POKEMON_TYPES.map((type) => ({
        value: type,
        label: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
    }));
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
            <div className={randomizerField}>
                <Select
                    label="Randomizer"
                    value={value.randomizerMode}
                    onChange={(randomizerMode) =>
                        onChange({
                            ...value,
                            randomizerMode:
                                randomizerMode as FullGameSettingsValue['randomizerMode'],
                        })
                    }
                    options={[...RANDOMIZER_MODE_OPTIONS]}
                />
                <button
                    type="button"
                    className={modesGuideButton}
                    onClick={() => setModesGuideOpen(true)}
                    aria-label="How do modes work?"
                    title="How do modes work?"
                >
                    ?
                </button>
            </div>
            {isModesGuideOpen && (
                <Modal
                    title="Randomizer modes"
                    className={guideModal}
                    onClose={() => setModesGuideOpen(false)}
                >
                    <RandomizerModesGuide />
                </Modal>
            )}
            <Checkbox
                label="Mono run"
                checked={value.monoRunEnabled}
                title="Only Pokémon of a single type can be used."
                onChange={(monoRunEnabled) =>
                    onChange({ ...value, monoRunEnabled })
                }
            />
            {value.monoRunEnabled && (
                <>
                    <Select
                        label="Mono type"
                        value={value.monoRunType}
                        onChange={(monoRunType) =>
                            onChange({ ...value, monoRunType })
                        }
                        options={monoRunTypeOptions}
                    />
                    <Checkbox
                        label="Allow future evolutions"
                        checked={value.monoRunFutureEvolutions}
                        title="Also allow Pokémon that can later evolve into the mono type."
                        onChange={(monoRunFutureEvolutions) =>
                            onChange({
                                ...value,
                                monoRunFutureEvolutions,
                            })
                        }
                    />
                </>
            )}
            <Checkbox
                label="Dupes clause"
                checked={value.dupesClauseEnabled}
                title="Prevents using multiple Pokémon from the same evolution line."
                onChange={(dupesClauseEnabled) =>
                    onChange({ ...value, dupesClauseEnabled })
                }
            />
            {!value.monoRunEnabled && (
                <Checkbox
                    label="Release starter"
                    checked={value.releaseStarterEnabled}
                    onChange={(releaseStarterEnabled) =>
                        onChange({ ...value, releaseStarterEnabled })
                    }
                />
            )}
            {!value.monoRunEnabled && (
                <Select
                    label="Tera raids"
                    value={value.teraRaids}
                    onChange={(teraRaids) =>
                        onChange({
                            ...value,
                            teraRaids:
                                teraRaids as FullGameSettingsValue['teraRaids'],
                        })
                    }
                    options={[
                        { value: 'none', label: 'None' },
                        {
                            value: 'single',
                            label: 'Single encounter per ★ rating',
                        },
                        { value: 'unlimited', label: 'Unlimited' },
                    ]}
                />
            )}
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
            <section className={section}>
                <h3 className={banHeading}>Ban list</h3>
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
                        const isDisabled = Boolean(
                            preset.disabled || addsNoNewNames,
                        );
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
                    label="Add a Pokémon ban"
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
                                    banList: value.banList.filter(
                                        (item) => item !== name,
                                    ),
                                })
                            }
                            ariaLabel={`Remove ${name} from ban list`}
                            title={`Remove ${name}`}
                        >
                            {name} ×
                        </BadgeButton>
                    ))}
                </div>
            </section>
        </div>
    );
}

const panel = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const randomizerField = css`
    display: flex;
    align-items: flex-end;
    gap: var(--space-2);

    & > label {
        flex: 1;
    }
`;

const modesGuideButton = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 2.4rem;
    height: 2.4rem;
    padding: 0 0 var(--space-3);
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    cursor: pointer;

    &:hover {
        color: var(--color-accent);
    }

    &:focus-visible {
        outline: 0.2rem solid var(--color-accent);
        outline-offset: 0.1rem;
    }
`;

const guideModal = css`
    max-width: 64rem;
    max-height: 90vh;
    overflow-y: auto;
`;

const section = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    padding-block: var(--space-2);
    border-block: 0.1rem solid var(--color-border);
`;

const banHeading = css`
    margin: 0;
    font-size: var(--font-size-base);
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
