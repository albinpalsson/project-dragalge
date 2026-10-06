import { getEncounterGroupKey } from '../pokemon-species';
import { useGame } from '../views/Game/GameContext';
import { useLocationEncountersQuery } from '../views/Game/queries';
import type { EncounterStatus } from '../db/game-db/queries';
import type { LocationEncounterView } from '../db/pokemon-data/queries';

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
    const originGroup = roll ? getEncounterGroupKey(roll.rolled_as) : undefined;
    const matchingEncounters = roll
        ? encounterRows.filter(
              (encounter) =>
                  getEncounterGroupKey(encounter.name) === originGroup,
          )
        : [];
    const selectedEncounter = matchingEncounters[0];

    const encounterRoll =
        roll && selectedEncounter
            ? {
                  ...selectedEncounter,
                  name: roll.pokemon_name,
                  status: roll.status,
                  displayName: getEncounterGroupKey(roll.pokemon_name),
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
