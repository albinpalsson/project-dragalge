import { css } from '@pokedb2/css-in-js';
import { GameCard } from './GameCard';
import { ImportGameModal } from './ImportGameModal';
import { NewGameModal } from './NewGameModal';
import { useGameCards } from './queries';

interface HomeProps {
    onOpenGame: (gameRunId: string) => void;
}

export function Home({ onOpenGame }: HomeProps) {
    const gameCards = useGameCards();

    return (
        <div className={content}>
            <NewGameModal onOpenGame={onOpenGame} />
            <ImportGameModal />

            <section>
                <h2>Games</h2>
                {gameCards.isPending && <p className={mutedText}>Loading...</p>}
                {gameCards.isSuccess && (
                    <ul className={gamesList}>
                        {(gameCards.data ?? []).map((card) => (
                            <li key={card.game.id}>
                                <GameCard
                                    game={card.game}
                                    obtained={card.obtained}
                                    isLost={card.isLost}
                                    onOpenGame={() => onOpenGame(card.game.name)}
                                />
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

const mutedText = css`
    color: var(--color-text-muted);
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
