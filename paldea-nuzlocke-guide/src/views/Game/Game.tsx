import { css } from '@project-dragalge/css-in-js';
import { useMemo } from 'react';
import { HeaderSlot } from '../../components/HeaderSlot';
import { Box } from './Box/Box';
import { GameProvider, useGame } from './GameContext';
import { useEvolutionGraphQuery } from '../../hooks/useEvolutionGraphQuery';
import { usePokemonTypeCatalogQuery } from '../../hooks/usePokemonTypeCatalogQuery';
import { ProgressionTimeline } from './progression/ProgressionTimeline';
import {
    useBanListEntriesQuery,
    useEncounterRollsQuery,
    useGameRunQuery,
} from './queries';
import { GameSettingsModal } from './GameSettingsModal';
import {
    BAN_REASON,
    buildSpeciesBans,
    type GetBanReason,
    toSpeciesName,
} from '../../utils/ban-list';
import { getMonoRunEligibleNames } from '../../utils/mono-run';

interface GameProps {
    gameName: string;
}

export function Game({ gameName }: GameProps) {
    const gameRunQuery = useGameRunQuery(gameName);

    if (gameRunQuery.isError) {
        return <p>Error loading game: {String(gameRunQuery.error)}</p>;
    }

    if (gameRunQuery.isPending) {
        return <p>Loading game...</p>;
    }

    if (!gameRunQuery.data) {
        return <p>Game not found: {gameName}</p>;
    }

    return <LoadedGame game={gameRunQuery.data} />;
}

type Game = NonNullable<ReturnType<typeof useGameRunQuery>['data']>;

function LoadedGame({ game }: { game: Game }) {
    const encounterRollsQuery = useEncounterRollsQuery(game.name);
    const banReasonResult = useGameBanReason(game);

    if (encounterRollsQuery.isError) {
        return (
            <p>
                Error loading encounter rolls:{' '}
                {String(encounterRollsQuery.error)}
            </p>
        );
    }

    if (banReasonResult.status === 'error') {
        return <p>Error loading ban list: {banReasonResult.error.message}</p>;
    }

    if (
        encounterRollsQuery.isPending ||
        banReasonResult.status === 'pending'
    ) {
        return <p>Loading game...</p>;
    }

    if (banReasonResult.status !== 'ready') {
        return <p>Loading game...</p>;
    }

    return (
        <GameProvider
            value={{
                name: game.name,
                run: game,
                settings: game.settings,
                randomizerMode: game.settings.randomizerMode,
                encounters: encounterRollsQuery.data,
                getBanReason: banReasonResult.getBanReason,
            }}
        >
            <GameContent key={game.name} />
        </GameProvider>
    );
}

type GameBanReasonResult =
    | { status: 'pending' }
    | { status: 'error'; error: Error }
    | {
          status: 'ready';
          getBanReason: GetBanReason;
      };

function useGameBanReason(game: Game): GameBanReasonResult {
    const encounterRollsQuery = useEncounterRollsQuery(game.name);
    const banListEntriesQuery = useBanListEntriesQuery(game.name);
    const evolutionGraphQuery = useEvolutionGraphQuery();
    const typeCatalogQuery = usePokemonTypeCatalogQuery();
    const encounterRolls = encounterRollsQuery.data;
    const banListEntries = banListEntriesQuery.data;
    const evolutionGraph = evolutionGraphQuery.data;
    const typeCatalog = typeCatalogQuery.data;

    // Part of the game context value, so it must only change with its inputs.
    const getBanReason = useMemo<GetBanReason | undefined>(() => {
        if (
            !encounterRolls ||
            !banListEntries ||
            !evolutionGraph ||
            !typeCatalog
        ) {
            return undefined;
        }

        const usedEncounterNames = encounterRolls
            .filter(
                (encounter) =>
                    encounter.status === 'caught' ||
                    encounter.status === 'eliminated',
            )
            .map((encounter) => encounter.pokemon_name);

        const monoRunEligibleNames = getMonoRunEligibleNames(
            game.settings,
            typeCatalog,
            evolutionGraph,
        );

        const speciesBans = buildSpeciesBans({
            manualBanNames: banListEntries.map((entry) => entry.pokemon_name),
            getEvolutionFamily: evolutionGraph.getEvolutionFamily,
            banFullEvolutionLines: game.settings.banFullEvolutionLines,
            dupesClauseEnabled: game.settings.dupesClauseEnabled,
            usedEncounterNames,
        });

        return (pokemonName, options) => {
            const speciesBan = speciesBans.get(toSpeciesName(pokemonName));
            if (speciesBan) {
                return speciesBan;
            }
            if (
                !options?.ignoreMonoRun &&
                monoRunEligibleNames &&
                !monoRunEligibleNames.has(pokemonName)
            ) {
                return BAN_REASON.MonoRun;
            }
            return undefined;
        };
    }, [
        encounterRolls,
        banListEntries,
        evolutionGraph,
        typeCatalog,
        game.settings,
    ]);

    if (
        encounterRollsQuery.isPending ||
        banListEntriesQuery.isPending ||
        evolutionGraphQuery.isPending ||
        typeCatalogQuery.isPending
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
    if (typeCatalogQuery.isError) {
        return { status: 'error', error: typeCatalogQuery.error };
    }
    if (!getBanReason) {
        return { status: 'pending' };
    }

    return { status: 'ready', getBanReason };
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
