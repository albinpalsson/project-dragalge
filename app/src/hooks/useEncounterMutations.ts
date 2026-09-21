import type { EncounterStatus } from '../db/game-db/queries';
import {
    useAddEncounterRollMutation,
    useSetEncounterPokemonMutation,
    useSetEncounterRollStatusMutation,
    useSetPartySlotMutation,
} from '../views/Game/queries';

export function useEncounterMutations() {
    const addRollMutation = useAddEncounterRollMutation();
    const setPokemonMutation = useSetEncounterPokemonMutation();
    const setStatusMutation = useSetEncounterRollStatusMutation();
    const setPartySlotMutation = useSetPartySlotMutation();

    return {
        isBusy:
            addRollMutation.isPending ||
            setPokemonMutation.isPending ||
            setStatusMutation.isPending ||
            setPartySlotMutation.isPending,
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
    };
}
