import { css } from '@pokedb2/css-in-js';
import { Box } from './Box/Box';
import { GameProvider } from './GameContext';
import { InletGrotto } from './progression/encounters/InletGrotto';
import { PocoPath } from './progression/encounters/PocoPath';
import { StarterCard } from './StarterCard';
import { toRandomizerMode } from '../../randomizer';
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
            <section className={layout}>
                <div className={topRow}>
                    <h2 className={heading}>{game.id}</h2>
                    <Box />
                </div>
                <ol className={cardList}>
                    <li>
                        <StarterCard />
                    </li>
                    <li>
                        <PocoPath />
                    </li>
                    <li>
                        <InletGrotto />
                    </li>
                </ol>
            </section>
        </GameProvider>
    );
}

const layout = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
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
  border-bottom: 0.1rem solid var(--color-border);
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-lg);
`;

const cardList = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`;
