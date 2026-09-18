import { useGame } from '../views/Game/GameContext';
import { useLocationEncountersQuery } from '../views/Game/queries';
import type { EncounterStatus } from '../db/game-db/schema';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { getRandomizerDisplayName } from '../randomizer-groups';

export interface EncounterRollDetails extends LocationEncounterView {
    status: EncounterStatus;
    displayName: string;
    subAreas: string[];
}

export function useEncounterRoll(locationName: string) {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(locationName);
    const encounterRows = encountersQuery.data?.encounters ?? [];
    const roll = game.encounters.find(
        (encounter) => encounter.location_name === locationName,
    );
    const selectedEncounter = encounterRows.find(
        (encounter) => encounter.name === roll?.rolled_as,
    );

    const subAreas = roll
        ? [
              ...new Set(
                  encounterRows
                      .filter((encounter) => encounter.name === roll.rolled_as)
                      .map((encounter) => encounter.subArea),
              ),
          ]
        : [];

    const encounterRoll =
        roll && selectedEncounter
            ? {
                  ...selectedEncounter,
                  status: roll.status,
                  displayName: getRandomizerDisplayName(roll.rolled_as),
                  subAreas:
                      subAreas.length > 0
                          ? subAreas
                          : [selectedEncounter.subArea],
              }
            : undefined;

    return encounterRoll;
}
