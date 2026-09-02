import { useMutation, useQuery, useClient } from '../../server-query';
import { invalidateQueries } from '@pokedb2/server-query';
import {
    createGame,
    listCaughtPokemon,
    listGames,
    type CreateGameInput,
} from '../../db/game-db/queries';
import { listPokemonByIds } from '../../db/pokemon-data/queries';
import type { CaughtPokemonRow, GameRunRow } from '../../db/game-db/schema';
import type { PokemonRow } from '@pokedb2/pokemon-data';

const GAMES_QUERY_KEY = ['games'];
const GAME_CARDS_QUERY_KEY = ['game-cards'];

export interface GameCardViewModel {
    game: GameRunRow;
    caught: Array<CaughtPokemonRow & { pokemon: PokemonRow }>;
}

export function useGames() {
    return useQuery({
        queryKey: GAMES_QUERY_KEY,
        queryFn: listGames,
    });
}

export function useGameCards() {
    return useQuery({
        queryKey: GAME_CARDS_QUERY_KEY,
        queryFn: async (): Promise<GameCardViewModel[]> => {
            const games = await listGames();
            const caughtByGame = new Map<string, CaughtPokemonRow[]>();
            const pokemonIds = new Set<number>();

            await Promise.all(
                games.map(async (game) => {
                    const caught = await listCaughtPokemon(game.id);
                    caughtByGame.set(game.id, caught);
                    for (const row of caught) {
                        pokemonIds.add(row.pokemon_id);
                    }
                }),
            );

            const pokemonRows = await listPokemonByIds([...pokemonIds]);
            const pokemonById = new Map(
                pokemonRows.map((pokemon) => [pokemon.id, pokemon]),
            );

            return games.map((game) => ({
                game,
                caught: (caughtByGame.get(game.id) ?? []).flatMap((row) => {
                    const pokemon = pokemonById.get(row.pokemon_id);
                    return pokemon ? [{ ...row, pokemon }] : [];
                }),
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
