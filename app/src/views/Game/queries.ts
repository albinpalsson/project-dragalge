import { invalidateQueries } from '@pokedb2/server-query';
import { useClient, useMutation, useQuery } from '../../server-query';
import {
    addCaughtPokemon,
    type AddCaughtPokemonInput,
    listCaughtPokemon,
} from '../../db/game-db/queries';
import {
    getLocationEncounterDetails,
    listStarters,
    type LocationEncounterView,
} from '../../db/pokemon-data/queries';

const caughtQueryKey = (gameRunId: string) => ['caught-pokemon', gameRunId];

export function useStartersQuery() {
    return useQuery({
        queryKey: ['starters'],
        queryFn: listStarters,
    });
}

export function useCaughtPokemonQuery(gameRunId: string) {
    return useQuery({
        queryKey: caughtQueryKey(gameRunId),
        queryFn: () => listCaughtPokemon(gameRunId),
    });
}

export function useLocationEncountersQuery(locationId: string) {
    return useQuery({
        queryKey: ['location-encounters', locationId],
        queryFn: () => getLocationEncounterDetails(locationId),
    });
}

export function useCatchPokemonMutation() {
    const client = useClient();
    return useMutation({
        mutationFn: async (input: AddCaughtPokemonInput) => {
            const caught = await addCaughtPokemon(input);
            invalidateQueries(client, { queryKey: caughtQueryKey(input.gameRunId) });
            return caught;
        },
    });
}

export type { LocationEncounterView };
