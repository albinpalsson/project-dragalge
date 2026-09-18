import { invalidateQueries } from '@pokedb2/server-query';
import { useClient, useMutation, useQuery } from '../../server-query';
import {
    addEncounterRoll,
    getGameRun,
    listEncounterRolls,
    setEncounterRollStatus,
    setEncounterPokemon,
    setPartySlot,
    setPocoPathOceanSetting,
    listBossBattleProgress,
    setBossBattleResult,
    clearBossBattleResult,
} from '../../db/game-db/queries';
import {
    getLocationEncounterDetails,
    getBossBattleRoster,
    getFirstEvolutionStage,
    getTypeChart,
    type LocationEncounterView,
} from '../../db/pokemon-data/queries';
import {
    encounterRollsQueryKey,
    GAME_CARDS_QUERY_KEY,
    gameRunQueryKey,
    locationEncountersQueryKey,
    bossBattleRosterQueryKey,
    bossBattleProgressQueryKey,
    pokemonFirstStageQueryKey,
    TYPE_CHART_QUERY_KEY,
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

export function useBossBattleRosterQuery(battleName: string) {
    return useQuery({
        queryKey: bossBattleRosterQueryKey(battleName),
        queryFn: () => getBossBattleRoster(battleName),
        staleTime: Infinity,
    });
}

export function useFirstEvolutionStageQuery(pokemonName: string) {
    return useQuery({
        queryKey: pokemonFirstStageQueryKey(pokemonName),
        queryFn: () => getFirstEvolutionStage(pokemonName),
        staleTime: Infinity,
    });
}

export function useTypeChartQuery() {
    return useQuery({
        queryKey: TYPE_CHART_QUERY_KEY,
        queryFn: () => getTypeChart(),
        staleTime: Infinity,
    });
}

export function useBossBattleProgressQuery(gameRunId: string) {
    return useQuery({
        queryKey: bossBattleProgressQueryKey(gameRunId),
        queryFn: () => listBossBattleProgress(gameRunId),
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

export function useSetEncounterPokemonMutation() {
    return useRollMutation(setEncounterPokemon);
}

export function useSetPartySlotMutation() {
    return useRollMutation(setPartySlot);
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

function useBossBattleResultMutation<
    TInput extends { gameRunId: string },
    TResult,
>(mutationFn: (input: TInput) => Promise<TResult>) {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: TInput) => {
            const result = await mutationFn(input);
            invalidateQueries(client, {
                queryKey: bossBattleProgressQueryKey(input.gameRunId),
            });
            invalidateQueries(client, { queryKey: GAME_CARDS_QUERY_KEY });
            return result;
        },
    });
}

export function useSetBossBattleResultMutation() {
    return useBossBattleResultMutation(setBossBattleResult);
}

export function useClearBossBattleResultMutation() {
    return useBossBattleResultMutation(clearBossBattleResult);
}

export type { LocationEncounterView };
