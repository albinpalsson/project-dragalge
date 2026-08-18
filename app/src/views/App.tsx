import { useMemo, useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from './Button';
import { ThemeToggle } from './ThemeToggle';
import { useCreateGame, useGames } from './queries';
import {
    generateDefaultGameName,
    type GameVariant,
} from '../db/game-db/queries';

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const card = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
`;

const field = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const input = css`
  padding: var(--space-2);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
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

export function App() {
    const [isStartFormOpen, setStartFormOpen] = useState(false);
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
        setStartFormOpen(false);
    };

    return (
        <main>
            <div className={header}>
                <h1>PokeDB</h1>
                <ThemeToggle />
            </div>

            <Button
                label="Start New Game"
                onClick={() => setStartFormOpen((prev) => !prev)}
            />

            {isStartFormOpen && (
                <section className={card}>
                    <label className={field}>
                        Version
                        <select
                            className={input}
                            value={variant}
                            onChange={(e) =>
                                setVariant(e.target.value as GameVariant)
                            }
                        >
                            <option value="s">Scarlet</option>
                            <option value="v">Violet</option>
                        </select>
                    </label>
                    <label className={field}>
                        Name (optional)
                        <input
                            className={input}
                            value={name}
                            placeholder={defaultName}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </label>
                    <Button label="Start" onClick={handleStart} />
                </section>
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
        </main>
    );
}
