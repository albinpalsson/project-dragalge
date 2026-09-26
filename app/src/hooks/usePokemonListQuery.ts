import { listAllPokemon } from '../db/pokemon-data/queries';
import { useQuery } from '../server-query';

export function usePokemonListQuery() {
    return useQuery({
        queryKey: ['pokemon-list'],
        queryFn: listAllPokemon,
        staleTime: Infinity,
    });
}
