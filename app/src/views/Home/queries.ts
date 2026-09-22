import { useMutation, useQuery, useClient } from '../../server-query';
import { invalidateQueries } from '@pokedb2/server-query';
import {
    createGame,
    listEncounterRolls,
    listGames,
    listBossBattleProgress,
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
    GameRunRow,
    BossBattleProgressRow,
} from '../../db/game-db/queries';
import { GAMES_QUERY_KEY, GAME_CARDS_QUERY_KEY } from '../../query-keys';

export interface GameCardState {
    game: GameRunRow;
    obtained: EncounterRollRow[];
    bossProgress: BossBattleProgressRow[];
    isLost: boolean;
}

export function useGameCards() {
    return useQuery({
        queryKey: GAME_CARDS_QUERY_KEY,
        queryFn: async (): Promise<GameCardState[]> => {
            const games = await listGames();
            const obtainedByGame = new Map<number, EncounterRollRow[]>();
            const progressByGame = new Map<number, BossBattleProgressRow[]>();

            await Promise.all(
                games.map(async (game) => {
                    const [rolls, progress] = await Promise.all([
                        listEncounterRolls(game.id),
                        listBossBattleProgress(game.id),
                    ]);
                    const obtained = rolls.filter(
                        (row) =>
                            row.status === 'caught' ||
                            row.status === 'eliminated',
                    );
                    obtainedByGame.set(game.id, obtained);
                    progressByGame.set(game.id, progress);
                }),
            );

            return games.map((game) => {
                const progress = progressByGame.get(game.id) ?? [];
                const isLost = progress.some((p) => p.result === 'lost');
                return {
                    game,
                    obtained: obtainedByGame.get(game.id) ?? [],
                    bossProgress: progress,
                    isLost,
                };
            });
        },
    });
}

export function useCreateGame() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: CreateGameInput) => {
            const game = await createGame(input);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            return game;
        },
    });
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
            return game;
        },
    });
}
