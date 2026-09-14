import type { EncounterStatus } from '../db/game-db/schema';
import {
    useAddEncounterRollMutation,
    useSetEncounterRollStatusMutation,
    useSetPartySlotMutation,
} from '../views/Game/queries';

export function useEncounterMutations() {
    const addRollMutation = useAddEncounterRollMutation();
    const setStatusMutation = useSetEncounterRollStatusMutation();
    const setPartySlotMutation = useSetPartySlotMutation();

    return {
        isBusy:
            addRollMutation.isPending ||
            setStatusMutation.isPending ||
            setPartySlotMutation.isPending,
        addRoll(
            gameRunId: string,
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
            gameRunId: string,
            locationName: string,
            status: EncounterStatus,
        ) {
            return setStatusMutation.mutateAsync({
                gameRunId,
                locationName,
                status,
            });
        },
        setPartySlot(gameRunId: string, locationName: string, slot: number) {
            return setPartySlotMutation.mutateAsync({
                gameRunId,
                locationName,
                slot,
            });
        },
    };
}
