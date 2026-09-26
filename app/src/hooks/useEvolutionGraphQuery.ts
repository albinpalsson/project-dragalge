import { useQuery } from '../server-query';
import { getEvolutionGraph } from '../db/pokemon-data/evolution-graph';
import { EVOLUTION_GRAPH_QUERY_KEY } from '../query-keys';

export function useEvolutionGraphQuery() {
    return useQuery({
        queryKey: EVOLUTION_GRAPH_QUERY_KEY,
        queryFn: getEvolutionGraph,
        staleTime: Infinity,
    });
}