import { css, cx } from '@project-dragalge/css-in-js';
import { textLink } from '../../components/text-link';
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
                    <p>
                        Guide your Pokemon Scarlet or Violet Nuzlocke with a
                        suggested route for encounters and boss battles, plus
                        an encounter randomizer to help keep your catches
                        unpredictable.
                    </p>
                    <p>
                        Your runs are saved in this browser. No account or
                        sign-up is required, and you can transfer runs between
                        devices using manual export/import.&nbsp;
                    <button
                        className={textLink}
                        type="button"
                        onClick={onOpenAbout}
                    >
                        Read more about the guide
                    </button>
                    </p>
                </section>
            )}

            <NewGameModal onOpenGame={onOpenGame} />
            <ImportGameModal />

            <section>
                <h2>Stored games</h2>
                {gameCards.isPending && <p className={mutedText}>Loading...</p>}
                {gameCards.isError && (
                    <p>Error loading games: {gameCards.error?.message}</p>
                )}
                {gameCards.isSuccess && (
                    <ul className={gamesList}>
                        {(gameCards.data ?? []).map((card) => (
                            <li className={gameListItem} key={card.game.id}>
                                <GameCard
                                    game={card.game}
                                    obtained={card.obtained}
                                    status={card.status}
                                    progressPercent={card.progressPercent}
                                    onOpenGame={() =>
                                        onOpenGame(card.game.name)
                                    }
                                />
                            </li>
                        ))}
                        {ghostCardSlots
                            .slice(gameCards.data?.length ?? 0)
                            .map((slot) => (
                                <li
                                    className={cx(
                                        gameListItem,
                                        slot.hideOnSmall && hideOnSmallGhost,
                                    )}
                                    key={slot.id}
                                    aria-hidden="true"
                                >
                                    <div className={ghostCard} />
                                </li>
                            ))}
                    </ul>
                )}
            </section>

            <p className={notice}>
                Pokémon icons are sourced from Pokémon Database. Some Pokémon
                data is derived from Bulbapedia. See{' '}
                <button
                    className={textLink}
                    type="button"
                    onClick={onOpenLicenses}
                >
                    Licenses &amp; Notices
                </button>{' '}
                for details.
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
    padding-bottom: var(--space-4);
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

const ghostCardSlots = [
    { id: 'ghost-0', hideOnSmall: false },
    { id: 'ghost-1', hideOnSmall: true },
    { id: 'ghost-2', hideOnSmall: true },
    { id: 'ghost-3', hideOnSmall: true },
    { id: 'ghost-4', hideOnSmall: true },
    { id: 'ghost-5', hideOnSmall: true },
] as const;

const hideOnSmallGhost = css`
    @media (max-width: 34rem) {
        display: none;
    }
`;

const ghostCard = css`
    width: 100%;
    max-width: 36rem;
    min-height: 24rem;
    background: color-mix(in srgb, var(--color-surface) 45%, transparent);
    border: 0.1rem solid color-mix(in srgb, var(--color-border) 55%, transparent);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
`;
