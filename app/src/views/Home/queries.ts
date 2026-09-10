import { useMutation, useQuery, useClient } from '../../server-query';
import { invalidateQueries } from '@pokedb2/server-query';
import {
    createGame,
    listEncounterRolls,
    listGames,
    type CreateGameInput,
} from '../../db/game-db/queries';
import type { EncounterRollRow, GameRunRow } from '../../db/game-db/schema';
import { GAMES_QUERY_KEY, GAME_CARDS_QUERY_KEY } from '../../query-keys';

export interface GameCardState {
    game: GameRunRow;
    obtained: EncounterRollRow[];
}

export function useGameCards() {
    return useQuery({
        queryKey: GAME_CARDS_QUERY_KEY,
        queryFn: async (): Promise<GameCardState[]> => {
            const games = await listGames();
            const obtainedByGame = new Map<string, EncounterRollRow[]>();

            await Promise.all(
                games.map(async (game) => {
                    const rolls = await listEncounterRolls(game.id);
                    const obtained = rolls.filter(
                        (row) =>
                            row.status === 'caught' ||
                            row.status === 'eliminated',
                    );
                    obtainedByGame.set(game.id, obtained);
                }),
            );

            return games.map((game) => ({
                game,
                obtained: obtainedByGame.get(game.id) ?? [],
            }));
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
