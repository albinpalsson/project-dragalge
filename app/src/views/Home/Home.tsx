import { useMemo, useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { TextField } from '../../components/TextField';
import { GameCard } from './GameCard';
import { useCreateGame, useGameCards } from './queries';
import {
    generateDefaultGameName,
    GAME_NAME_MAX_BYTES,
    type GameVariant,
} from '../../db/game-db/queries';
import {
    DEFAULT_RANDOMIZER_MODE,
    RANDOMIZER_MODE_OPTIONS,
    type RandomizerMode,
} from '../../randomizer';

interface HomeProps {
    onOpenGame: (gameRunId: string) => void;
}

export function Home({ onOpenGame }: HomeProps) {
    const [isStartModalOpen, setStartModalOpen] = useState(false);
    const [variant, setVariant] = useState<GameVariant>('s');
    const [randomizerMode, setRandomizerMode] = useState<RandomizerMode>(
        DEFAULT_RANDOMIZER_MODE,
    );
    const [name, setName] = useState('');

    const gameCards = useGameCards();
    const createGame = useCreateGame();

    const defaultName = useMemo(
        () => generateDefaultGameName(variant),
        [variant],
    );

    const handleStart = async () => {
        const game = await createGame.mutateAsync({
            name: name || defaultName,
            variant,
            randomizerMode,
        });
        setName('');
        setStartModalOpen(false);
        onOpenGame(game.name);
    };

    return (
        <div className={content}>
            <Button
                className={startButton}
                onClick={() => setStartModalOpen(true)}
            >
                Start New Game
            </Button>

            {isStartModalOpen && (
                <Modal
                    title="Start New Game"
                    onClose={() => setStartModalOpen(false)}
                >
                    <div className={form}>
                        <Select
                            label="Version"
                            value={variant}
                            onChange={(v) => setVariant(v as GameVariant)}
                            options={[
                                { value: 's', label: 'Scarlet' },
                                { value: 'v', label: 'Violet' },
                            ]}
                        />
                        <TextField
                            label="Name (optional)"
                            value={name}
                            placeholder={defaultName}
                            onChange={setName}
                            maxLength={GAME_NAME_MAX_BYTES}
                        />
                        <Select
                            label="Randomizer"
                            value={randomizerMode}
                            onChange={(value) =>
                                setRandomizerMode(value as RandomizerMode)
                            }
                            options={[...RANDOMIZER_MODE_OPTIONS]}
                        />
                        <div className={formActions}>
                            <Button onClick={handleStart}>Start</Button>
                            <Button
                                variant="secondary"
                                onClick={() => setStartModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal>
            )}

            <section>
                <h2>Games</h2>
                {gameCards.isPending && <p className={mutedText}>Loading...</p>}
                {gameCards.isSuccess && (
                    <ul className={gamesList}>
                        {gameCards.data.map((card) => (
                            <li key={card.game.id}>
                                <button
                                    type="button"
                                    className={gameCardButton}
                                    onClick={() => onOpenGame(card.game.name)}
                                >
                                    <GameCard
                                        game={card.game}
                                        obtained={card.obtained}
                                        isLost={card.isLost}
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 120rem;
  margin: 0 auto;
`;

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

const gamesList = css`
  display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const mutedText = css`
  color: var(--color-text-muted);
`;

const gameCardButton = css`
  display: block;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`;
