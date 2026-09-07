import { useGame } from '../views/Game/GameContext';
import type { EncounterStatus } from '../db/game-db/schema';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import {
    useAddEncounterRollMutation,
    useClearEncounterRollMutation,
    useSetEncounterRollStatusMutation,
} from '../views/Game/queries';

export function useEncounterRollActions(locationName: string) {
    const game = useGame();
    const addRollMutation = useAddEncounterRollMutation();
    const setStatusMutation = useSetEncounterRollStatusMutation();
    const clearRollMutation = useClearEncounterRollMutation();

    return {
        isBusy:
            addRollMutation.isPending ||
            setStatusMutation.isPending ||
            clearRollMutation.isPending,
        pickEncounter(encounter: LocationEncounterView) {
            addRollMutation.mutate({
                gameRunId: game.id,
                locationName,
                pokemonName: encounter.name,
            });
        },
        setStatus(status: EncounterStatus) {
            setStatusMutation.mutate({
                gameRunId: game.id,
                locationName,
                status,
            });
        },
        clearRoll() {
            clearRollMutation.mutate({
                gameRunId: game.id,
                locationName,
            });
        },
    };
}
