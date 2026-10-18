import { useQuery } from '../../../server-query';
import {
    getPokemon,
    getPokemonEvolutionDetails,
} from '../../../db/pokemon-data/queries';
import { pokemonEvolutionQueryKey, pokemonQueryKey } from '../../../query-keys';

export function usePokemonQuery(pokemonName: string) {
    return useQuery({
        queryKey: pokemonQueryKey(pokemonName),
        queryFn: () => getPokemon(pokemonName),
        staleTime: Infinity,
    });
}

export function usePokemonEvolutionQuery(pokemonName: string) {
    return useQuery({
        queryKey: pokemonEvolutionQueryKey(pokemonName),
        queryFn: () => getPokemonEvolutionDetails(pokemonName),
        staleTime: Infinity,
    });
}
