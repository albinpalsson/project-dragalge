import type { EncounterStatus } from '../db/game-db/queries';
import {
    useAddEncounterRollMutation,
    useClearEncounterRollMutation,
    useSetEncounterPokemonMutation,
    useSetEncounterRollStatusMutation,
    useSetPartySlotMutation,
    useSkipEncounterMutation,
} from '../views/Game/queries';

export function useEncounterMutations() {
    const addRollMutation = useAddEncounterRollMutation();
    const skipMutation = useSkipEncounterMutation();
    const setPokemonMutation = useSetEncounterPokemonMutation();
    const setStatusMutation = useSetEncounterRollStatusMutation();
    const setPartySlotMutation = useSetPartySlotMutation();
    const clearRollMutation = useClearEncounterRollMutation();

    return {
        isBusy:
            addRollMutation.isPending ||
            skipMutation.isPending ||
            setPokemonMutation.isPending ||
            setStatusMutation.isPending ||
            setPartySlotMutation.isPending ||
            clearRollMutation.isPending,
        addRoll(
            gameRunId: number,
            locationName: string,
            pokemonName: string,
            status?: EncounterStatus,
        ) {
            return addRollMutation.mutateAsync({
                gameRunId,
                locationName,
                pokemonName,
                status,
            });
        },
        skip(gameRunId: number, locationName: string) {
            return skipMutation.mutateAsync({ gameRunId, locationName });
        },
        setStatus(
            gameRunId: number,
            locationName: string,
            status: EncounterStatus,
        ) {
            return setStatusMutation.mutateAsync({
                gameRunId,
                locationName,
                status,
            });
        },
        setPokemon(
            gameRunId: number,
            locationName: string,
            pokemonName: string,
        ) {
            return setPokemonMutation.mutateAsync({
                gameRunId,
                locationName,
                pokemonName,
            });
        },
        setPartySlot(gameRunId: number, locationName: string, slot: number) {
            return setPartySlotMutation.mutateAsync({
                gameRunId,
                locationName,
                slot,
            });
        },
        clear(gameRunId: number, locationName: string) {
            return clearRollMutation.mutateAsync({ gameRunId, locationName });
        },
    };
}
