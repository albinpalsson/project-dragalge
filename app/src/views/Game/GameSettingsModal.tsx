import { useEffect, useMemo, useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Modal } from '../../components/Modal';
import { IconButton } from '../../components/IconButton';
import { useBanListPresetOptions } from '../../hooks/useBanListPresetOptions';
import { usePokemonListQuery } from '../../hooks/usePokemonListQuery';
import {
    cloneSettings,
    type FullGameSettingsValue,
} from '../../utils/game-setting-presets';
import { GameSettingsPanel } from '../Home/GameSettingsPanel';
import { useGame } from './GameContext';
import {
    useBanListEntriesQuery,
    useUpdateGameRunSettingsMutation,
} from './queries';

export function GameSettingsModal() {
    const game = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const banListEntriesQuery = useBanListEntriesQuery(game.id);
    const pokemonQuery = usePokemonListQuery();
    const presets = useBanListPresetOptions();
    const updateSettingsMutation = useUpdateGameRunSettingsMutation();

    const initialValue = useMemo<FullGameSettingsValue>(
        () => ({
            randomizerMode: game.settings.randomizerMode,
            dupesClauseEnabled: game.settings.dupesClauseEnabled,
            banFullEvolutionLines: game.settings.banFullEvolutionLines,
            banList: (banListEntriesQuery.data ?? []).map(
                (entry) => entry.pokemon_name,
            ),
            releaseStarterEnabled: game.settings.releaseStarterEnabled,
            teraRaids: game.settings.teraRaids,
            showHelpfulTips: game.settings.showHelpfulTips,
            includeTeamStarBattles: game.settings.includeTeamStarBattles,
        }),
        [game.settings, banListEntriesQuery.data],
    );
    const [draft, setDraft] = useState<FullGameSettingsValue>(
        cloneSettings(initialValue),
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        setDraft(cloneSettings(initialValue));
    }, [initialValue, isOpen]);

    const handleChange = (value: FullGameSettingsValue) => {
        setDraft(value);
        const { banList, ...settings } = value;
        void updateSettingsMutation.mutateAsync({
            gameRunId: game.id,
            gameRunName: game.run.name,
            settings,
            banListNames: banList,
        });
    };

    return (
        <>
            <IconButton label="Game settings" onClick={() => setIsOpen(true)}>
                ⚙
            </IconButton>

            {isOpen && (
                <Modal title="Game settings" onClose={() => setIsOpen(false)}>
                    {banListEntriesQuery.isPending || pokemonQuery.isPending ? (
                        <p className={status}>Loading settings...</p>
                    ) : (
                        <GameSettingsPanel
                            value={draft}
                            onChange={handleChange}
                            suggestions={pokemonQuery.data ?? []}
                            presets={presets}
                        />
                    )}
                    {updateSettingsMutation.isPending && (
                        <p className={status}>Saving...</p>
                    )}
                </Modal>
            )}
        </>
    );
}

const status = css`
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;
