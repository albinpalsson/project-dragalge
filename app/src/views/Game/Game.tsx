import { css } from '@pokedb2/css-in-js';
import { HeaderSlot } from '../../components/HeaderSlot';
import { Box } from './Box/Box';
import { GameProvider, useGame } from './GameContext';
import { useEvolutionGraphQuery } from '../../hooks/useEvolutionGraphQuery';
import { ProgressionTimeline } from './progression/ProgressionTimeline';
import {
    useBanListEntriesQuery,
    useBossBattleProgressQuery,
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
    const bossBattleProgressQuery = useBossBattleProgressQuery(game.id);
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
        return <p>Error loading ban list: {banReasonsMap.error.message}</p>;
    }
    
    if (bossBattleProgressQuery.isError) {
        return (
            <p>
                Error loading boss battle progress:{' '}
                {bossBattleProgressQuery.error.message}
            </p>
        );
    }

    if (
        encounterRollsQuery.isPending ||
        banReasonsMap.status === 'pending' ||
        bossBattleProgressQuery.isPending
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
            <GameContent key={game.id} />
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

    return {
        status: 'ready',
        banReasons: buildBanReasonMap({
            manualBanNames: banListEntriesQuery.data.map(
                (entry) => entry.pokemon_name,
            ),
            getEvolutionFamily: evolutionGraphQuery.data.getEvolutionFamily,
            banFullEvolutionLines: game.settings.banFullEvolutionLines,
            dupesClauseEnabled: game.settings.dupesClauseEnabled,
            usedEncounterNames,
        }),
    };
}

function GameContent() {
    const game = useGame();

    return (
        <section className={layout}>
            <HeaderSlot>
                <h2 className={gameName}>{game.run.name}</h2>
                <Box />
                <GameSettingsModal />
            </HeaderSlot>
            <ProgressionTimeline />
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

const gameName = css`
    flex: 1;
    min-width: 0;
    margin: 0;
    overflow: hidden;
    font-size: var(--font-size-lg);
    text-overflow: ellipsis;
    white-space: nowrap;
`;

