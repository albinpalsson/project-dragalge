import { css } from '@pokedb2/css-in-js';
import { GameCard } from './GameCard';
import { ImportGameModal } from './ImportGameModal';
import { NewGameModal } from './NewGameModal';
import { useGameCards } from './queries';

interface HomeProps {
    onOpenGame: (gameRunId: string) => void;
    onOpenAbout: () => void;
    onOpenLicenses: () => void;
}

export function Home({ onOpenGame, onOpenAbout, onOpenLicenses }: HomeProps) {
    const gameCards = useGameCards();
    const hasNoGames = gameCards.isSuccess && gameCards.data?.length === 0;

    return (
        <div className={content}>
            {hasNoGames && (
                <section className={welcome} aria-labelledby="welcome-title">
                    <h2 id="welcome-title">Welcome to PokéDB</h2>
                    <p>
                        Track encounters, boss battles, and caught Pokémon in
                        your Paldea Nuzlocke runs. Your runs are saved in this
                        browser, with no account or cross-device sync.
                    </p>
                    <button
                        className={textButton}
                        type="button"
                        onClick={onOpenAbout}
                    >
                        About PokéDB
                    </button>
                </section>
            )}

            <NewGameModal onOpenGame={onOpenGame} />
            <ImportGameModal />

            <section>
                <h2>Games</h2>
                {gameCards.isPending && <p className={mutedText}>Loading...</p>}
                {gameCards.isSuccess && (
                    <ul className={gamesList}>
                        {(gameCards.data ?? []).map((card) => (
                            <li className={gameListItem} key={card.game.id}>
                                <GameCard
                                    game={card.game}
                                    obtained={card.obtained}
                                    isLost={card.isLost}
                                    onOpenGame={() =>
                                        onOpenGame(card.game.name)
                                    }
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            <p className={notice}>
                Some data is derived from Bulbapedia; license terms can vary by
                source page. Pokémon icons are sourced from Pokémon Database.{' '}
                <button
                    className={textButton}
                    type="button"
                    onClick={onOpenLicenses}
                >
                    Licenses &amp; Notices
                </button>
            </p>
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

const welcome = css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
    padding-bottom: var(--space-3);
    border-bottom: 0.1rem solid var(--color-border);

    h2,
    p {
        margin: 0;
    }

    p {
        max-width: 70rem;
        color: var(--color-text-secondary);
    }
`;

const notice = css`
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const textButton = css`
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-info);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
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

const gameListItem = css`
    flex: 0 1 36rem;
    min-width: 0;
    max-width: 100%;
`;
