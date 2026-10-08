import { useMemo, useState, type ComponentProps } from 'react';
import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { TextField } from '../../components/TextField';
import { useBanListPresetOptions } from '../../hooks/useBanListPresetOptions';
import { usePokemonListQuery } from '../../hooks/usePokemonListQuery';
import {
    generateDefaultGameName,
    GAME_NAME_MAX_BYTES,
    type GameVariant,
} from '../../db/game-db/queries';
import {
    applyMonoRunRules,
    cloneSettings,
    getSettingsPreset,
    SETTINGS_PRESETS,
    type FullGameSettingsValue,
    type SettingsPresetKey,
} from '../../utils/game-setting-presets';
import { GameSettingsPanel } from './GameSettingsPanel';
import { useCreateGame } from './queries';

interface NewGameModalProps {
    onOpenGame: (gameRunId: string) => void;
}

export function NewGameModal({ onOpenGame }: NewGameModalProps) {
    const [isStartModalOpen, setStartModalOpen] = useState(false);
    const [startStep, setStartStep] = useState<'basics' | 'settings'>('basics');
    const [variant, setVariant] = useState<GameVariant>('s');
    const [presetKey, setPresetKey] = useState<SettingsPresetKey>('fun');
    const [name, setName] = useState('');
    const [gameSettings, setGameSettings] = useState(() =>
        cloneSettings(getSettingsPreset('fun').defaults),
    );

    const createGame = useCreateGame();
    const presets = useBanListPresetOptions();
    const pokemonQuery = usePokemonListQuery();
    const pokemon = pokemonQuery.data ?? [];

    const defaultName = useMemo(
        () => generateDefaultGameName(variant),
        [variant],
    );

    const openStartModal = () => {
        const selectedPreset = getSettingsPreset('fun');
        setPresetKey(selectedPreset.key);
        setGameSettings(cloneSettings(selectedPreset.defaults));
        setStartStep('basics');
        setName('');
        setVariant('s');
        setStartModalOpen(true);
    };

    const closeStartModal = () => {
        setStartModalOpen(false);
        setStartStep('basics');
    };

    const selectPreset = (nextPresetKey: SettingsPresetKey) => {
        setPresetKey(nextPresetKey);
        setGameSettings(
            cloneSettings(getSettingsPreset(nextPresetKey).defaults),
        );
    };

    const handleStart = async () => {
        const { banList, ...settings } = applyMonoRunRules(gameSettings);
        const game = await createGame.mutateAsync({
            name: name || defaultName,
            variant,
            settings,
            banListNames: banList,
        });
        closeStartModal();
        onOpenGame(game.name);
    };

    return (
        <>
            <Button className={startButton} onClick={openStartModal}>
                Start New Game
            </Button>

            {isStartModalOpen && (
                <Modal title="Start New Game" onClose={closeStartModal}>
                    <div className={form}>
                        {startStep === 'basics' ? (
                            <BasicsStep
                                variant={variant}
                                onVariantChange={setVariant}
                                name={name}
                                onNameChange={setName}
                                defaultName={defaultName}
                                presetKey={presetKey}
                                onSelectPreset={selectPreset}
                                onNext={() => setStartStep('settings')}
                                onCancel={closeStartModal}
                            />
                        ) : (
                            <SettingsStep
                                value={gameSettings}
                                onChange={setGameSettings}
                                suggestions={pokemon}
                                presets={presets}
                                onBack={() => setStartStep('basics')}
                                onStart={handleStart}
                            />
                        )}
                    </div>
                </Modal>
            )}
        </>
    );
}

interface BasicsStepProps {
    variant: GameVariant;
    onVariantChange: (variant: GameVariant) => void;
    name: string;
    onNameChange: (name: string) => void;
    defaultName: string;
    presetKey: SettingsPresetKey;
    onSelectPreset: (presetKey: SettingsPresetKey) => void;
    onNext: () => void;
    onCancel: () => void;
}

function BasicsStep({
    variant,
    onVariantChange,
    name,
    onNameChange,
    defaultName,
    presetKey,
    onSelectPreset,
    onNext,
    onCancel,
}: BasicsStepProps) {
    return (
        <>
            <Select
                label="Version"
                value={variant}
                onChange={(v) => onVariantChange(v as GameVariant)}
                options={[
                    { value: 's', label: 'Scarlet' },
                    { value: 'v', label: 'Violet' },
                ]}
            />
            <TextField
                label="Name (optional)"
                value={name}
                placeholder={defaultName}
                onChange={onNameChange}
                maxLength={GAME_NAME_MAX_BYTES}
            />
            <div className={presetSection}>
                <h3 className={presetHeading}>Preset</h3>
                <div className={presetButtons}>
                    {SETTINGS_PRESETS.map((preset) => (
                        <BadgeButton
                            key={preset.key}
                            onClick={() => onSelectPreset(preset.key)}
                            className={
                                preset.key === presetKey
                                    ? activePreset
                                    : undefined
                            }
                            title={preset.description}
                        >
                            {preset.label}
                        </BadgeButton>
                    ))}
                </div>
                <p className={presetDescription}>
                    {getSettingsPreset(presetKey).description}
                </p>
            </div>
            <p className={mutedText}>
                You can customize every detail on the next screen, or later from
                the in-game settings (⚙) button.
            </p>
            <div className={formActions}>
                <Button onClick={onNext}>Next</Button>
                <Button variant="secondary" onClick={onCancel}>
                    Cancel
                </Button>
            </div>
        </>
    );
}

interface SettingsStepProps {
    value: FullGameSettingsValue;
    onChange: (value: FullGameSettingsValue) => void;
    suggestions: readonly string[];
    presets: ComponentProps<typeof GameSettingsPanel>['presets'];
    onBack: () => void;
    onStart: () => void;
}

function SettingsStep({
    value,
    onChange,
    suggestions,
    presets,
    onBack,
    onStart,
}: SettingsStepProps) {
    return (
        <>
            <GameSettingsPanel
                value={value}
                onChange={onChange}
                suggestions={suggestions}
                presets={presets}
            />
            <div className={formActions}>
                <Button variant="secondary" onClick={onBack}>
                    Back
                </Button>
                <Button onClick={onStart}>Start</Button>
            </div>
        </>
    );
}

const startButton = css`
  align-self: flex-start;
`;

const form = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const formActions = css`
  display: flex;
  gap: var(--space-2);
`;

const presetSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const presetHeading = css`
    margin: 0;
    font-size: var(--font-size-base);
`;

const presetButtons = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
`;

const activePreset = css`
    border-color: var(--color-primary);
`;

const presetDescription = css`
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const mutedText = css`
    color: var(--color-text-muted);
`;
