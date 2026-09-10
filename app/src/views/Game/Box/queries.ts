import { useQuery } from '../../../server-query';
import { getPokemon } from '../../../db/pokemon-data/queries';
import { pokemonQueryKey } from '../../../query-keys';

export function usePokemonQuery(pokemonName: string) {
    return useQuery({
        queryKey: pokemonQueryKey(pokemonName),
        queryFn: () => getPokemon(pokemonName),
        staleTime: Infinity,
    });
}
