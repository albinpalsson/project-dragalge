import { invalidateQueries } from '@pokedb2/server-query';
import { useClient, useMutation, useQuery } from '../../server-query';
import {
    addEncounterRoll,
    type UpdateGameRunSettingsInput,
    clearEncounterRoll,
    getGameRun,
    listBanListEntries,
    listEncounterRolls,
    setEncounterRollStatus,
    setEncounterPokemon,
    setPartySlot,
    setPocoPathOceanSetting,
    updateGameRunSettings,
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
    banListQueryKey,
    GAME_CARDS_QUERY_KEY,
    GAME_RUN_SNAPSHOTS_QUERY_KEY,
    gameRunQueryKey,
    locationEncountersQueryKey,
    bossBattleRosterQueryKey,
    bossBattleProgressQueryKey,
    pokemonFirstStageQueryKey,
    TYPE_CHART_QUERY_KEY,
} from '../../query-keys';

export function useGameRunQuery(gameRunName: string) {
    return useQuery({
        queryKey: gameRunQueryKey(gameRunName),
        queryFn: () => getGameRun(gameRunName),
    });
}

export function useEncounterRollsQuery(gameRunId: number) {
    return useQuery({
        queryKey: encounterRollsQueryKey(gameRunId),
        queryFn: () => listEncounterRolls(gameRunId),
    });
}

export function useBanListEntriesQuery(gameRunId: number) {
    return useQuery({
        queryKey: banListQueryKey(gameRunId),
        queryFn: () => listBanListEntries(gameRunId),
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

export function useBossBattleProgressQuery(gameRunId: number) {
    return useQuery({
        queryKey: bossBattleProgressQueryKey(gameRunId),
        queryFn: () => listBossBattleProgress(gameRunId),
    });
}

function useRollMutation<TInput extends { gameRunId: number }, TResult>(
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
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
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

export function useClearEncounterRollMutation() {
    return useRollMutation(clearEncounterRoll);
}

export function useSetPocoPathOceanSettingMutation() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: {
            gameRunId: number;
            gameRunName: string;
            includeOcean: boolean;
        }) => {
            await setPocoPathOceanSetting(input);
            invalidateQueries(client, {
                queryKey: gameRunQueryKey(input.gameRunName),
            });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
        },
    });
}

export function useUpdateGameRunSettingsMutation() {
    const client = useClient();
    return useMutation({
        mutationFn: async (
            input: UpdateGameRunSettingsInput & { gameRunName: string },
        ) => {
            await updateGameRunSettings(input);
            invalidateQueries(client, {
                queryKey: gameRunQueryKey(input.gameRunName),
            });
            invalidateQueries(client, {
                queryKey: banListQueryKey(input.gameRunId),
            });
            invalidateQueries(client, {
                queryKey: GAME_CARDS_QUERY_KEY,
            });
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
        },
    });
}

function useBossBattleResultMutation<
    TInput extends { gameRunId: number },
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
            invalidateQueries(client, {
                queryKey: GAME_RUN_SNAPSHOTS_QUERY_KEY,
            });
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
