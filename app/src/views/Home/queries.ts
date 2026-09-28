import { useMemo } from 'react';
import { useMutation, useQuery, useClient } from '../../server-query';
import { invalidateQueries } from '@pokedb2/server-query';
import {
    createGame,
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
    BossBattleProgressRow,
} from '../../db/game-db/queries';
import {
    GAMES_QUERY_KEY,
    GAME_CARDS_QUERY_KEY,
    GAME_RUN_SNAPSHOTS_QUERY_KEY,
} from '../../query-keys';
import { PROGRESSION_ITEMS, isRaidResolved } from '../Game/progression/progression-items';
import { listBossBattleProgress, listEncounterRolls, listGames } from '../../db/game-db/queries';
import { useEvolutionGraphQuery } from '../../hooks/useEvolutionGraphQuery';

export interface GameCardState {
    game: GameRun;
    obtained: EncounterRollRow[];
    bossProgress: BossBattleProgressRow[];
    isLost: boolean;
}

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
                        listEncounterRolls(game.id),
                        listBossBattleProgress(game.id),
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
    const data = useMemo<GameCardState[] | undefined>(
        () =>
            snapshotsQuery.data?.map((snapshot) => {
                const obtained = snapshot.encounterRolls.filter(
                    (row) =>
                        row.status === 'caught' || row.status === 'eliminated',
                );
                const isLost = snapshot.bossProgress.some(
                    (battle) => battle.result === 'lost',
                );
                return {
                    game: snapshot.game,
                    obtained,
                    bossProgress: snapshot.bossProgress,
                    isLost,
                };
            }),
        [snapshotsQuery.data],
    );

    return {
        ...snapshotsQuery,
        data,
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

export interface ChampionPreset {
    label: string;
    names: string[];
}

export function useCompletedGameChampionPresets() {
    const snapshotsQuery = useGameRunSnapshotsQuery();
    const graphQuery = useEvolutionGraphQuery();

    const data = useMemo<ChampionPreset[] | undefined>(() => {
        if (!snapshotsQuery.data || !graphQuery.data) {
            return undefined;
        }

        const presets: ChampionPreset[] = [];
        for (const snapshot of snapshotsQuery.data) {
            const { game, encounterRolls: rolls, bossProgress: progress } =
                snapshot;
            const settings = game.settings;
            const starter = rolls.find(
                (roll) => roll.location_name === 'Starter',
            );
            const starterRoot = starter
                ? graphQuery.data.getFirstStage(starter.pokemon_name)
                : undefined;
            const complete = PROGRESSION_ITEMS.every((item) => {
                if (
                    item.isVisible &&
                    !item.isVisible({ settings, encounters: rolls })
                ) {
                    return true;
                }
                if (
                    item.countsTowardProgress &&
                    !item.countsTowardProgress({ settings, encounters: rolls })
                ) {
                    return true;
                }
                if (item.kind === 'encounter') {
                    return rolls.some(
                        (roll) =>
                            roll.location_name === item.locationName &&
                            roll.status !== 'pending',
                    );
                }
                if (item.kind === 'action') {
                    return item.isResolved({
                        settings,
                        encounters: rolls,
                    });
                }
                if (item.kind === 'raid') {
                    return isRaidResolved(rolls, item.stars);
                }
                const battleName = item.getBattleName(starterRoot ?? '');
                return Boolean(
                    battleName &&
                        progress.some(
                            (battle) => battle.battle_name === battleName,
                        ),
                );
            });
            if (!complete) {
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
    }, [snapshotsQuery.data, graphQuery.data]);

    const isPending = snapshotsQuery.isPending || graphQuery.isPending;
    const isError = snapshotsQuery.isError || graphQuery.isError;
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

export function useGameExport(gameRunId: number) {
    return useQuery({
        queryKey: ['game-export', gameRunId],
        queryFn: () => buildExport(gameRunId),
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
