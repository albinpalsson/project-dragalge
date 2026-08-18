import { useMutation, useQuery, useClient } from '../server-query';
import { invalidateQueries } from '@pokedb2/server-query';
import {
    createGame,
    listGames,
    type CreateGameInput,
} from '../db/game-db/queries';

const GAMES_QUERY_KEY = ['games'];

export function useGames() {
    return useQuery({
        queryKey: GAMES_QUERY_KEY,
        queryFn: listGames,
    });
}

export function useCreateGame() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: CreateGameInput) => {
            const game = await createGame(input);
            invalidateQueries(client, { queryKey: GAMES_QUERY_KEY });
            return game;
        },
    });
}
