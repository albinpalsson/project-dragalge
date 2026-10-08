import { getPokemonTypeCatalog } from '../db/pokemon-data/queries';
import { POKEMON_TYPE_CATALOG_QUERY_KEY } from '../query-keys';
import { useQuery } from '../server-query';

export function usePokemonTypeCatalogQuery() {
    return useQuery({
        queryKey: POKEMON_TYPE_CATALOG_QUERY_KEY,
        queryFn: getPokemonTypeCatalog,
        staleTime: Infinity,
    });
}
