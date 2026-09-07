import { invalidateQueries } from '@pokedb2/server-query';
import { useClient, useMutation, useQuery } from '../../server-query';
import {
    addEncounterRoll,
    clearEncounterRoll,
    getGameRun,
    listEncounterRolls,
    setEncounterRollStatus,
    setPocoPathOceanSetting,
} from '../../db/game-db/queries';
import {
    getLocationEncounterDetails,
    type LocationEncounterView,
} from '../../db/pokemon-data/queries';
import {
    encounterRollsQueryKey,
    GAME_CARDS_QUERY_KEY,
    gameRunQueryKey,
    locationEncountersQueryKey,
} from '../../query-keys';

export function useGameRunQuery(gameRunId: string) {
    return useQuery({
        queryKey: gameRunQueryKey(gameRunId),
        queryFn: () => getGameRun(gameRunId),
    });
}

export function useEncounterRollsQuery(gameRunId: string) {
    return useQuery({
        queryKey: encounterRollsQueryKey(gameRunId),
        queryFn: () => listEncounterRolls(gameRunId),
    });
}

export function useLocationEncountersQuery(locationName: string) {
    return useQuery({
        queryKey: locationEncountersQueryKey(locationName),
        queryFn: () => getLocationEncounterDetails(locationName),
        staleTime: Infinity,
    });
}

function useRollMutation<TInput extends { gameRunId: string }, TResult>(
    mutationFn: (input: TInput) => Promise<TResult>,
) {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: TInput) => {
            const result = await mutationFn(input);
            invalidateQueries(client, {
                queryKey: encounterRollsQueryKey(input.gameRunId),
            });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            return result;
        },
    });
}

export function useAddEncounterRollMutation() {
    return useRollMutation(addEncounterRoll);
}

export function useSetEncounterRollStatusMutation() {
    return useRollMutation(setEncounterRollStatus);
}

export function useClearEncounterRollMutation() {
    return useRollMutation(clearEncounterRoll);
}

export function useSetPocoPathOceanSettingMutation() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: {
            gameRunId: string;
            includeOcean: boolean;
        }) => {
            await setPocoPathOceanSetting(input);
            invalidateQueries(client, {
                queryKey: gameRunQueryKey(input.gameRunId),
            });
        },
    });
}

export type { LocationEncounterView };
