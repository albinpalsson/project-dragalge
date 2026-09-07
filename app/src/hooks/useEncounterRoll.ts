import { useGame } from '../views/Game/GameContext';
import { useLocationEncountersQuery } from '../views/Game/queries';
import type { EncounterStatus } from '../db/game-db/schema';
import type { LocationEncounterView } from '../db/pokemon-data/queries';

export interface EncounterRollDetails extends LocationEncounterView {
    status: EncounterStatus;
}

export function useEncounterRoll(locationName: string) {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(locationName);
    const roll = game.encounters.find(
        (encounter) => encounter.location_name === locationName,
    );
    const selectedEncounter = encountersQuery.data?.encounters.find(
        (encounter) => encounter.name === roll?.pokemon_name,
    );

    const encounterRoll =
        roll && selectedEncounter
            ? { ...selectedEncounter, status: roll.status }
            : undefined;

    return encounterRoll;
}
