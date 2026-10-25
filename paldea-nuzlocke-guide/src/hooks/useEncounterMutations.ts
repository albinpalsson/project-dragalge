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
            gameName: string,
            locationName: string,
            pokemonName: string,
            status?: EncounterStatus,
        ) {
            return addRollMutation.mutateAsync({
                gameName,
                locationName,
                pokemonName,
                status,
            });
        },
        skip(gameName: string, locationName: string) {
            return skipMutation.mutateAsync({ gameName, locationName });
        },
        setStatus(
            gameName: string,
            locationName: string,
            status: EncounterStatus,
        ) {
            return setStatusMutation.mutateAsync({
                gameName,
                locationName,
                status,
            });
        },
        setPokemon(
            gameName: string,
            locationName: string,
            pokemonName: string,
        ) {
            return setPokemonMutation.mutateAsync({
                gameName,
                locationName,
                pokemonName,
            });
        },
        setPartySlot(gameName: string, locationName: string, slot: number) {
            return setPartySlotMutation.mutateAsync({
                gameName,
                locationName,
                slot,
            });
        },
        clear(gameName: string, locationName: string) {
            return clearRollMutation.mutateAsync({ gameName, locationName });
        },
    };
}
