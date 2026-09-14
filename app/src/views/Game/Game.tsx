import { css } from '@pokedb2/css-in-js';
import { Box } from './Box/Box';
import { GameProvider, useGame } from './GameContext';
import { useProgressionTracker } from '../../hooks/useProgressionTracker';
import { toRandomizerMode } from '../../randomizer';
import { PROGRESSION_ITEMS } from './progression/progression-items';
import { useEncounterRollsQuery, useGameRunQuery } from './queries';

interface GameProps {
    gameRunId: string;
}

export function Game({ gameRunId }: GameProps) {
    const gameRunQuery = useGameRunQuery(gameRunId);
    const encounterRollsQuery = useEncounterRollsQuery(gameRunId);

    if (gameRunQuery.isError) {
        return <p>Error loading game: {String(gameRunQuery.error)}</p>;
    }

    if (encounterRollsQuery.isError) {
        return (
            <p>
                Error loading encounter rolls:{' '}
                {String(encounterRollsQuery.error)}
            </p>
        );
    }

    if (gameRunQuery.isPending || encounterRollsQuery.isPending) {
        return <p>Loading game...</p>;
    }

    if (!gameRunQuery.data) {
        return <p>Game not found: {gameRunId}</p>;
    }

    const game = gameRunQuery.data;

    return (
        <GameProvider
            value={{
                id: game.id,
                run: game,
                settings: game.settings,
                randomizerMode: toRandomizerMode(game.randomizer_mode),
                encounters: encounterRollsQuery.data,
            }}
        >
            <GameContent />
        </GameProvider>
    );
}

function GameContent() {
    const game = useGame();
    const progression = useProgressionTracker();

    return (
        <section className={layout}>
            <div className={topRow}>
                <h2 className={heading}>
                    <span>{game.id}</span>
                    <span className={mutedText}>
                        {progression.percent}% complete
                    </span>
                </h2>
                <Box />
            </div>
            <ol className={cardList}>
                {PROGRESSION_ITEMS.map((item) => (
                    <li key={item.key} className={cardItem}>
                        {progression.nextKey === item.key && (
                            <p className={nextStepLabel}>→ Next step</p>
                        )}
                        <item.Component
                            isNext={progression.nextKey === item.key}
                        />
                    </li>
                ))}
            </ol>
        </section>
    );
}

const layout = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
    width: 100%;
    max-width: 90rem;
    margin: 0 auto;
    min-width: 0;
`;

const topRow = css`
    position: sticky;
    top: var(--header-height);
    z-index: 800;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) 0;
    width: 100%;
    min-width: 0;
    border-bottom: 0.1rem solid var(--color-border);
    background: var(--color-bg);
    box-shadow: 0 0.8rem 1.2rem -1.2rem rgba(0, 0, 0, 0.7);
`;

const heading = css`
    margin: 0;
    font-size: var(--font-size-lg);
    display: flex;
    align-items: center;
    gap: var(--space-2);
`;

const mutedText = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const cardList = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    list-style: none;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
`;

const cardItem = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    min-width: 0;

    > * {
        width: 100%;
        min-width: 0;
    }
`;

const nextStepLabel = css`
    margin: 0;
    color: var(--color-accent);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
`;
