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
    type GameVariant,
} from '../../db/game-db/queries';

interface HomeProps {
    onOpenGame: (gameRunId: string) => void;
}

export function Home({ onOpenGame }: HomeProps) {
    const [isStartModalOpen, setStartModalOpen] = useState(false);
    const [variant, setVariant] = useState<GameVariant>('s');
    const [name, setName] = useState('');

    const gameCards = useGameCards();
    const createGame = useCreateGame();

    const defaultName = useMemo(
        () => generateDefaultGameName(variant),
        [variant],
    );

    const handleStart = async () => {
        await createGame.mutateAsync({ name: name || defaultName, variant });
        setName('');
        setStartModalOpen(false);
    };

    return (
        <>
            <Button onClick={() => setStartModalOpen(true)}>
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
                        {(gameCards.data ?? []).map((card) => (
                            <li key={card.game.id}>
                                <button
                                    type="button"
                                    className={gameCardButton}
                                    onClick={() => onOpenGame(card.game.id)}
                                >
                                    <GameCard
                                        game={card.game}
                                        caughtPokemon={card.caught.map(
                                            (row) => row.pokemon,
                                        )}
                                    />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </>
    );
}

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