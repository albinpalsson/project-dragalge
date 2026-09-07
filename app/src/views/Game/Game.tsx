import { css } from '@pokedb2/css-in-js';
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

    if (gameRunQuery.error) {
        return <p>Error loading game: {String(gameRunQuery.error)}</p>;
    }

    if (encounterRollsQuery.error) {
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

    if (!encounterRollsQuery.data) {
        return <p>Encounter rolls are unavailable for game: {gameRunId}</p>;
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
            <section>
                <h2>{game.id}</h2>
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

const cardList = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`;
