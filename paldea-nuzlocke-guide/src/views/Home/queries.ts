import { useMemo } from 'react';
import { useMutation, useQuery, useClient } from '../../server-query';
import {
    invalidateQueries,
    removeQueries,
} from '@project-dragalge/server-query';
import {
    createGame,
    deleteGame,
    renameGame,
    setGameStatus,
    STARTER_LOCATION_NAME,
    type CreateGameInput,
} from '../../db/game-db/queries';
import {
    applyImport,
    buildExport,
    parseImport,
    type ParsedImport,
} from '../../db/game-db/export-import';
import type {
    EncounterRollRow,
    GameRun,
    GameStatus,
    BossBattleProgressRow,
} from '../../db/game-db/queries';
import {
    GAMES_QUERY_KEY,
    GAME_CARDS_QUERY_KEY,
    GAME_RUN_SNAPSHOTS_QUERY_KEY,
    banListQueryKey,
    bossBattleProgressQueryKey,
    encounterRollsQueryKey,
    gameRunQueryKey,
} from '../../query-keys';
import {
    listBossBattleProgress,
    listEncounterRolls,
    listGames,
} from '../../db/game-db/queries';
import {
    clearPersistentGameState,
    renamePersistentGameState,
} from '../../hooks/usePersistentGameState';
import { useEvolutionGraphQuery } from '../../hooks/useEvolutionGraphQuery';
import { calculateProgression } from '../Game/progression/progression-tracker';

export interface GameRunSnapshot {
    game: GameRun;
    encounterRolls: EncounterRollRow[];
    bossProgress: BossBattleProgressRow[];
}

export function useGameRunSnapshotsQuery() {
    return useQuery({
        queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
        queryFn: async (): Promise<GameRunSnapshot[]> => {
            const games = await listGames();
            return Promise.all(
                games.map(async (game) => {
                    const [encounterRolls, bossProgress] = await Promise.all([
                        listEncounterRolls(game.name),
                        listBossBattleProgress(game.name),
                    ]);
                    return {
                        game,
                        encounterRolls,
                        bossProgress,
                    };
                }),
            );
        },
    });
}

export function useGameCards() {
    const snapshotsQuery = useGameRunSnapshotsQuery();
    const graphQuery = useEvolutionGraphQuery();
    const data = useMemo(() => {
        const evolutionGraph = graphQuery.data;
        if (!snapshotsQuery.data || !evolutionGraph) {
            return undefined;
        }

        // Newest game first.
        return [...snapshotsQuery.data]
            .sort(
                (first, second) => second.game.createdAt - first.game.createdAt,
            )
            .map((snapshot) => {
                const obtained = snapshot.encounterRolls.filter(
                    (row) =>
                        row.status === 'caught' || row.status === 'eliminated',
                );
                const starterName = snapshot.encounterRolls.find(
                    (row) => row.location_name === STARTER_LOCATION_NAME,
                )?.pokemon_name;
                const starter = starterName
                    ? (evolutionGraph.getFirstStage(starterName) ?? starterName)
                    : null;
                const progression = calculateProgression(
                    {
                        settings: snapshot.game.settings,
                        encounters: snapshot.encounterRolls,
                    },
                    snapshot.bossProgress,
                    starter,
                );
                return {
                    game: snapshot.game,
                    obtained,
                    bossProgress: snapshot.bossProgress,
                    progressPercent: progression.percent,
                    status: snapshot.game.status,
                };
            });
    }, [snapshotsQuery.data, graphQuery.data]);

    const isError = snapshotsQuery.isError || graphQuery.isError;
    const isPending =
        !isError && (snapshotsQuery.isPending || graphQuery.isPending);
    const error = snapshotsQuery.isError
        ? snapshotsQuery.error
        : graphQuery.isError
          ? graphQuery.error
          : null;

    return {
        data,
        isPending,
        isError,
        isSuccess: !isPending && !isError,
        error,
    };
}

export function useCreateGame() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: CreateGameInput) => {
            const game = await createGame(input);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
            return game;
        },
    });
}

export function useDeleteGame() {
    const client = useClient();
    return useMutation({
        mutationFn: async (gameName: string) => {
            await deleteGame(gameName);
            // Queries and persisted UI state are keyed by name, which a new game
            // can reuse right away, so nothing of the deleted game may linger.
            removeQueries(client, { queryKey: gameRunQueryKey(gameName) });
            removeQueries(client, {
                queryKey: encounterRollsQueryKey(gameName),
            });
            removeQueries(client, { queryKey: banListQueryKey(gameName) });
            removeQueries(client, {
                queryKey: bossBattleProgressQueryKey(gameName),
            });
            clearPersistentGameState(gameName);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
        },
    });
}

export function useSetGameStatus() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: { gameName: string; status: GameStatus }) => {
            await setGameStatus(input.gameName, input.status);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            invalidateQueries(client, {
                queryKey: gameRunQueryKey(input.gameName),
            });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
        },
    });
}

export function useRenameGame() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: { gameName: string; newName: string }) => {
            const name = await renameGame(input.gameName, input.newName);
            // Queries and persisted UI state are keyed by name, so the old
            // name's entries are dropped and the persisted state moves over.
            removeQueries(client, {
                queryKey: gameRunQueryKey(input.gameName),
            });
            removeQueries(client, {
                queryKey: encounterRollsQueryKey(input.gameName),
            });
            removeQueries(client, {
                queryKey: banListQueryKey(input.gameName),
            });
            removeQueries(client, {
                queryKey: bossBattleProgressQueryKey(input.gameName),
            });
            renamePersistentGameState(input.gameName, name);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
            return name;
        },
    });
}

export interface ChampionPreset {
    label: string;
    names: string[];
}

export function useCompletedGameChampionPresets() {
    const snapshotsQuery = useGameRunSnapshotsQuery();

    const data = useMemo<ChampionPreset[] | undefined>(() => {
        if (!snapshotsQuery.data) {
            return undefined;
        }

        const presets: ChampionPreset[] = [];
        for (const { game, encounterRolls: rolls } of snapshotsQuery.data) {
            if (game.status !== 'won') {
                continue;
            }
            presets.push({
                label: `Previous champions (${game.name})`,
                names: rolls
                    .filter(
                        (roll) =>
                            roll.party_slot >= 1 &&
                            roll.party_slot <= 6 &&
                            roll.status !== 'eliminated',
                    )
                    .map((roll) => roll.pokemon_name),
            });
        }
        return presets;
    }, [snapshotsQuery.data]);

    return {
        data,
        isPending: snapshotsQuery.isPending,
        isError: snapshotsQuery.isError,
        isSuccess: snapshotsQuery.isSuccess,
        error: snapshotsQuery.isError ? snapshotsQuery.error : null,
    };
}

export function useGameExport(gameName: string) {
    return useQuery({
        queryKey: ['game-export', gameName],
        queryFn: () => buildExport(gameName),
    });
}

export function useParsedGameImport(importData: string) {
    return useQuery({
        queryKey: ['game-import', importData],
        queryFn: () => parseImport(importData),
    });
}

export function useImportGame() {
    const client = useClient();
    return useMutation({
        mutationFn: async ({
            parsed,
            name,
        }: {
            parsed: Extract<ParsedImport, { status: 'ok' }>;
            name: string;
        }) => {
            const game = await applyImport(parsed, name);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
            return game;
        },
    });
}
