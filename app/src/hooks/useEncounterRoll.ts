import { useGame } from '../views/Game/GameContext';
import { useLocationEncountersQuery } from '../views/Game/queries';
import type { EncounterStatus } from '../db/game-db/schema';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { getRandomizerDisplayName } from '../randomizer-groups';

export interface EncounterRollDetails extends LocationEncounterView {
    status: EncounterStatus;
    displayName: string;
    subAreaTerrains: { subArea: string; terrain: string }[];
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

    const matchingEncounters = roll
        ? encounterRows.filter((encounter) => encounter.name === roll.rolled_as)
        : [];

    const encounterRoll =
        roll && selectedEncounter
            ? {
                  ...selectedEncounter,
                  status: roll.status,
                  displayName: getRandomizerDisplayName(roll.rolled_as),
                  subAreaTerrains: matchingEncounters.map((encounter) => ({
                      subArea: encounter.subArea,
                      terrain: encounter.terrain,
                  })),
                  minLevel: Math.min(
                      ...matchingEncounters.map((e) => e.minLevel),
                  ),
                  maxLevel: Math.max(
                      ...matchingEncounters.map((e) => e.maxLevel),
                  ),
                  // "Joint" rate per time period: the best odds across all matching sub-area/terrain rows.
                  morningRate: Math.max(
                      ...matchingEncounters.map((e) => e.morningRate),
                  ),
                  dayRate: Math.max(
                      ...matchingEncounters.map((e) => e.dayRate),
                  ),
                  eveningRate: Math.max(
                      ...matchingEncounters.map((e) => e.eveningRate),
                  ),
                  nightRate: Math.max(
                      ...matchingEncounters.map((e) => e.nightRate),
                  ),
              }
            : undefined;

    return encounterRoll;
}
