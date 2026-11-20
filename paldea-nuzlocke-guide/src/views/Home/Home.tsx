import { css, cx } from '@project-dragalge/css-in-js';
import { FadeInImage } from '../../components/FadeInImage';
import { textLink } from '../../components/text-link';
import bellibolt from '../../../public/assets/bellibolt.avif';
import maushold from '../../../public/assets/maushold.avif';
import tinkatuff from '../../../public/assets/tinkatuff.avif';
import { GameCard } from './GameCard';
import { ImportGameModal } from './ImportGameModal';
import { NewGameModal } from './NewGameModal';
import { useGameCards } from './queries';
import { StorageSelect } from './StorageSelect';
import { getStorageMode } from '../../db/game-db/storage-mode';

interface HomeProps {
    onOpenGame: (gameName: string) => void;
    onOpenAbout: () => void;
    onOpenLicenses: () => void;
}

export function Home({ onOpenGame, onOpenAbout, onOpenLicenses }: HomeProps) {
    const gameCards = useGameCards();
    const hasNoGames = gameCards.isSuccess && gameCards.data?.length === 0;

    return (
        <div className={content}>
            {hasNoGames && <WelcomeSection onOpenAbout={onOpenAbout} />}

            <NewGameModal onOpenGame={onOpenGame} />
            <ImportGameModal />

            <section className={storedGames}>
                <h2>Stored games</h2>
                <StorageSelect className={storageSelect} />
                {gameCards.isPending && (
                    <p className={mutedText}>
                        {getStorageMode() === 'google-drive'
                            ? 'Loading games from Google Drive...'
                            : 'Loading...'}
                    </p>
                )}
                {gameCards.isError && (
                    <p>Error loading games: {gameCards.error?.message}</p>
                )}
                {gameCards.isSuccess && (
                    <ul className={gamesList}>
                        {(gameCards.data ?? []).map((card) => (
                            <li className={gameListItem} key={card.game.name}>
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
                            .map((slot, index) => (
                                <GhostCardItem
                                    key={slot.id}
                                    hideOnSmall={slot.hideOnSmall}
                                    isFirst={index === 0}
                                    hasNoGames={hasNoGames}
                                />
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
                for details. Read the{' '}
                <a className={textLink} href="/privacy.html">
                    Privacy policy
                </a>
                .
            </p>
        </div>
    );
}

function WelcomeSection({ onOpenAbout }: { onOpenAbout: () => void }) {
    return (
        <section className={welcome} aria-labelledby="welcome-title">
            <p>
                Guide your Scarlet/Violet Nuzlocke with a suggested
                route for encounters and boss battles, tracker, and an encounter
                randomizer to help keep your catches unpredictable.
            </p>
            <p>
                {getStorageMode() === 'google-drive'
                    ? 'Your runs are saved in your Google Drive.'
                    : 'Your runs are saved in this browser. No account or sign-up is required.'}
                &nbsp;
                <button
                    className={textLink}
                    type="button"
                    onClick={onOpenAbout}
                >
                    Read more
                </button>
            </p>
        </section>
    );
}

interface GhostCardItemProps {
    hideOnSmall: boolean;
    isFirst: boolean;
    hasNoGames: boolean;
}

function GhostCardItem({ hideOnSmall, isFirst, hasNoGames }: GhostCardItemProps) {
    return (
        <li
            className={cx(gameListItem, hideOnSmall && hideOnSmallGhost)}
            aria-hidden="true"
        >
            <div className={ghostCard}>
                {isFirst && hasNoGames && (
                    <>
                        <span className={ghostText}>
                            No game yet - placeholder
                        </span>
                        <GhostIcons />
                    </>
                )}
            </div>
        </li>
    );
}

function GhostIcons() {
    return (
        <span className={ghostIcons}>
            {ghostPokemon.map(({ name, src }) => (
                <span className={ghostIconSlot} key={name}>
                    <FadeInImage
                        className={ghostIcon}
                        src={src}
                        alt=""
                        lazy={false}
                    />
                </span>
            ))}
        </span>
    );
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
`;

const mutedText = css`
    color: var(--color-text-muted);
    padding: var(--space-5) var(--space-3);
`;

// The storage select sits right after the heading; everything else takes a
// full row of its own.
const storedGames = css`
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: var(--space-3);

    & > * {
        grid-column: 1 / -1;
    }

    & > h2 {
        grid-column: 1;
        grid-row: 1;
    }
`;

const storageSelect = css`
    && {
        grid-column: 2;
        grid-row: 1;
        justify-self: start;
        /* The heading has more space below than above; this centers the two. */
        margin-bottom: var(--space-2);
    }
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
    font-size: var(--font-size-xs);
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
    flex: 0 1 35rem;
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

// Listed right to left, matching the right-to-left icon grid.
// Inlined as data URIs (see `inlineAssets` in bundler.config.cjs) so the empty
// Home screen shows them at first paint without an image request.
const ghostPokemon = [
    { name: 'Bellibolt', src: bellibolt },
    { name: 'Maushold', src: maushold },
    { name: 'Tinkatuff', src: tinkatuff },
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
    border: 0.1rem dashed color-mix(in srgb, var(--color-border) 55%, transparent);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-sm);
    display: flex;
    flex-direction: column;
    padding: var(--space-2);

    img {
        opacity: 0.7;
    }
`;

const ghostText = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;

const ghostIcons = css`
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    align-items: center;
    align-self: center;
    width: min(100%, 34rem);
    margin-top: auto;
    direction: rtl;
    gap: var(--space-1);
`;

const ghostIconSlot = css`
    display: grid;
    place-items: center;
    min-width: 0;
    aspect-ratio: 1;
    direction: ltr;
`;

const ghostIcon = css`
    display: block;
    width: 100%;
    max-width: 5.2rem;
    aspect-ratio: 1;
    object-fit: contain;
`;
