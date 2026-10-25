import { invalidateQueries } from '@project-dragalge/server-query';
import { useClient, useMutation, useQuery } from '../../server-query';
import {
    addEncounterRoll,
    skipEncounter,
    type UpdateGameRunSettingsInput,
    clearEncounterRoll,
    getGameRun,
    listBanListEntries,
    listEncounterRolls,
    setEncounterRollStatus,
    setEncounterPokemon,
    setPartySlot,
    updateGameRunSettings,
    listBossBattleProgress,
    setBossBattleResult,
    clearBossBattleResult,
} from '../../db/game-db/queries';
import {
    getLocationEncounterDetails,
    getBossBattleRoster,
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
    TYPE_CHART_QUERY_KEY,
} from '../../query-keys';
import { filterEncountersForVariant } from '../../utils/game-variant';
import { useGame } from './GameContext';

export function useGameRunQuery(gameName: string) {
    return useQuery({
        queryKey: gameRunQueryKey(gameName),
        queryFn: () => getGameRun(gameName),
    });
}

export function useEncounterRollsQuery(gameName: string) {
    return useQuery({
        queryKey: encounterRollsQueryKey(gameName),
        queryFn: () => listEncounterRolls(gameName),
    });
}

export function useBanListEntriesQuery(gameName: string) {
    return useQuery({
        queryKey: banListQueryKey(gameName),
        queryFn: () => listBanListEntries(gameName),
    });
}

export function useLocationEncountersQuery(locationName: string) {
    return useQuery({
        queryKey: locationEncountersQueryKey(locationName),
        queryFn: () => getLocationEncounterDetails(locationName),
        staleTime: Infinity,
    });
}

export function useLocationEncounterCandidates(locationName: string) {
    const query = useLocationEncountersQuery(locationName);
    const game = useGame();

    if (!query.isSuccess) {
        return query;
    }

    const { encounters, ...locationDetails } = query.data;
    const allEncounters = filterEncountersForVariant(
        encounters,
        game.run.variant,
    );
    const rollableEncounters = allEncounters.filter(
        (encounter) => !game.getBanReason(encounter.name),
    );

    return {
        ...query,
        data: {
            ...locationDetails,
            allEncounters,
            rollableEncounters,
        },
    };
}

export function useBossBattleRosterQuery(battleName: string) {
    return useQuery({
        queryKey: bossBattleRosterQueryKey(battleName),
        queryFn: () => getBossBattleRoster(battleName),
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

export function useBossBattleProgressQuery(gameName: string) {
    return useQuery({
        queryKey: bossBattleProgressQueryKey(gameName),
        queryFn: () => listBossBattleProgress(gameName),
    });
}

function useRollMutation<TInput extends { gameName: string }, TResult>(
    mutationFn: (input: TInput) => Promise<TResult>,
) {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: TInput) => {
            const result = await mutationFn(input);
            invalidateQueries(client, {
                queryKey: encounterRollsQueryKey(input.gameName),
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

export function useSkipEncounterMutation() {
    return useRollMutation(skipEncounter);
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

export function useUpdateGameRunSettingsMutation() {
    const client = useClient();
    return useMutation({
        mutationFn: async (
            input: UpdateGameRunSettingsInput & { gameName: string },
        ) => {
            await updateGameRunSettings(input);
            invalidateQueries(client, {
                queryKey: gameRunQueryKey(input.gameName),
            });
            invalidateQueries(client, {
                queryKey: banListQueryKey(input.gameName),
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
    TInput extends { gameName: string },
    TResult,
>(mutationFn: (input: TInput) => Promise<TResult>) {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: TInput) => {
            const result = await mutationFn(input);
            invalidateQueries(client, {
                queryKey: bossBattleProgressQueryKey(input.gameName),
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
