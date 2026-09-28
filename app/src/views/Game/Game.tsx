import { css } from '@pokedb2/css-in-js';
import { Box } from './Box/Box';
import { GameProvider, useGame } from './GameContext';
import { useProgressionTracker } from '../../hooks/useProgressionTracker';
import { useEvolutionGraphQuery } from '../../hooks/useEvolutionGraphQuery';
import { PROGRESSION_ITEMS } from './progression/progression-items';
import {
    useBanListEntriesQuery,
    useEncounterRollsQuery,
    useGameRunQuery,
} from './queries';
import { GameSettingsModal } from './GameSettingsModal';
import { buildBanReasonMap } from '../../utils/ban-list';

interface GameProps {
    gameRunId: string;
}

export function Game({ gameRunId }: GameProps) {
    const gameRunQuery = useGameRunQuery(gameRunId);

    if (gameRunQuery.isError) {
        return <p>Error loading game: {String(gameRunQuery.error)}</p>;
    }

    if (gameRunQuery.isPending) {
        return <p>Loading game...</p>;
    }

    if (!gameRunQuery.data) {
        return <p>Game not found: {gameRunId}</p>;
    }

    return <LoadedGame game={gameRunQuery.data} />;
}

type Game = NonNullable<ReturnType<typeof useGameRunQuery>['data']>;

function LoadedGame({ game }: { game: Game }) {
    const encounterRollsQuery = useEncounterRollsQuery(game.id);
    const banReasonsMap = useBanReasonsMap(game);

    if (encounterRollsQuery.isError) {
        return (
            <p>
                Error loading encounter rolls:{' '}
                {String(encounterRollsQuery.error)}
            </p>
        );
    }

    if (banReasonsMap.status === 'error') {
        return (
            <p>
                Error loading ban list: {banReasonsMap.error.message}
            </p>
        );
    }

    if (
        encounterRollsQuery.isPending ||
        banReasonsMap.status === 'pending'
    ) {
        return <p>Loading game...</p>;
    }

    if (banReasonsMap.status !== 'ready') {
        return <p>Loading game...</p>;
    }


    return (
        <GameProvider
            value={{
                id: game.id,
                run: game,
                settings: game.settings,
                randomizerMode: game.settings.randomizerMode,
                encounters: encounterRollsQuery.data,
                banReasons: banReasonsMap.banReasons,
            }}
        >
            <GameContent />
        </GameProvider>
    );
}

type BanReasonsMapResult =
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | { status: 'ready'; banReasons: ReturnType<typeof buildBanReasonMap> };

function useBanReasonsMap(game: Game): BanReasonsMapResult {
    const encounterRollsQuery = useEncounterRollsQuery(game.id);
    const banListEntriesQuery = useBanListEntriesQuery(game.id);
    const evolutionGraphQuery = useEvolutionGraphQuery();

    if (
        encounterRollsQuery.isPending ||
        banListEntriesQuery.isPending ||
        evolutionGraphQuery.isPending
    ) {
        return { status: 'pending' };
    }

    if (encounterRollsQuery.isError) {
        return { status: 'error', error: encounterRollsQuery.error };
    }
    if (banListEntriesQuery.isError) {
        return { status: 'error', error: banListEntriesQuery.error };
    }
    if (evolutionGraphQuery.isError) {
        return { status: 'error', error: evolutionGraphQuery.error };
    }

    const usedEncounterNames = encounterRollsQuery.data
        .filter(
            (encounter) =>
                encounter.status === 'caught' ||
                encounter.status === 'eliminated',
        )
        .map((encounter) => encounter.pokemon_name);

    return { status: 'ready', banReasons: buildBanReasonMap({
        manualBanNames: banListEntriesQuery.data.map(
            (entry) => entry.pokemon_name,
        ),
        getEvolutionFamily: evolutionGraphQuery.data.getEvolutionFamily,
        banFullEvolutionLines: game.settings.banFullEvolutionLines,
        dupesClauseEnabled: game.settings.dupesClauseEnabled,
        usedEncounterNames,
    }) };
}

function GameContent() {
    const game = useGame();
    const progression = useProgressionTracker();
    const visibleItems = PROGRESSION_ITEMS.filter(
        (item) =>
            item.isVisible?.({
                settings: game.settings,
                encounters: game.encounters,
            }) ?? true,
    );

    return (
        <section className={layout}>
            <div className={topRow}>
                <h2 className={heading}>
                    <span className={gameName}>{game.run.name}</span>
                    <span className={mutedText}>
                        {progression.percent}% complete
                    </span>
                </h2>
                <div className={topActions}>
                    <GameSettingsModal />
                    <Box />
                </div>
            </div>
            <ol className={cardList}>
                {visibleItems.map((item) => (
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
    border-top: var(--space-1) solid var(--color-bg);
    border-bottom: 0.1rem solid var(--color-border);
    background: var(--color-bg);
    box-shadow: 0 0.8rem 1.2rem -1.2rem rgba(0, 0, 0, 0.7);
`;

const heading = css`
    margin: 0;
    font-size: var(--font-size-lg);
    display: flex;
    flex: 1 1 24rem;
    flex-wrap: wrap;
    min-width: 0;
    align-items: center;
    gap: var(--space-2);
`;

const gameName = css`
    min-width: 0;
    overflow-wrap: anywhere;
`;

const mutedText = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const topActions = css`
    display: flex;
    align-items: center;
    gap: var(--space-2);
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
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
`;
