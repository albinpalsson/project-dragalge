import { useMemo, useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { Select } from '../../components/Select';
import { TextField } from '../../components/TextField';
import { useCreateGame, useGames } from './queries';
import {
    generateDefaultGameName,
    type GameVariant,
} from '../../db/game-db/queries';

export function Home() {
    const [isStartModalOpen, setStartModalOpen] = useState(false);
    const [variant, setVariant] = useState<GameVariant>('s');
    const [name, setName] = useState('');

    const games = useGames();
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
                {games.isPending && <p className={mutedText}>Loading...</p>}
                {games.isSuccess && (
                    <ul className={gamesList}>
                        {(games.data ?? []).map((game) => (
                            <li key={game.id} className={gameRow}>
                                {game.id}
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
  flex-direction: column;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const gameRow = css`
  padding: var(--space-3);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const mutedText = css`
  color: var(--color-text-muted);
`;
