import {
    getBaseStatTotals,
    getBossBattleRosters,
    getEncounterDetailsForLocations,
} from '../../db/pokemon-data/mono-planner';
import { getTypeChart } from '../../db/pokemon-data/queries';
import { TYPE_CHART_QUERY_KEY } from '../../query-keys';
import { useQuery } from '../../server-query';

const BASE_STAT_TOTALS_QUERY_KEY = ['mono-planner', 'base-stat-totals'];

export function useAllLocationEncountersQuery(
    locationNames: readonly string[],
) {
    return useQuery({
        queryKey: ['mono-planner', 'location-encounters', locationNames],
        queryFn: () => getEncounterDetailsForLocations(locationNames),
        staleTime: Infinity,
    });
}

export function useBossBattleRostersQuery(battleNames: readonly string[]) {
    return useQuery({
        queryKey: ['mono-planner', 'boss-battle-rosters', battleNames],
        queryFn: () => getBossBattleRosters(battleNames),
        staleTime: Infinity,
    });
}

/**
 * Same query as the Game view's, kept here so the planner chunk does not pull
 * in `views/Game/queries.ts` and the Game context with it.
 */
export function useTypeChartQuery() {
    return useQuery({
        queryKey: TYPE_CHART_QUERY_KEY,
        queryFn: () => getTypeChart(),
        staleTime: Infinity,
    });
}

export function useBaseStatTotalsQuery() {
    return useQuery({
        queryKey: BASE_STAT_TOTALS_QUERY_KEY,
        queryFn: getBaseStatTotals,
        staleTime: Infinity,
    });
}
