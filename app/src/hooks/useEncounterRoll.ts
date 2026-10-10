import { getEncounterGroupKey } from '../pokemon-species';
import { useGame } from '../views/Game/GameContext';
import { useLocationEncountersQuery } from '../views/Game/queries';
import type { EncounterStatus } from '../db/game-db/queries';

export interface EncounterRollDetails {
    status: EncounterStatus;
    displayName: string;
    subAreaTerrains: { subArea: string; terrain: string }[];
    name: string;
    activeName: string;
    minLevel: number;
    maxLevel: number;
    morningRate: number;
    dayRate: number;
    eveningRate: number;
    nightRate: number;
}

export type EncounterRoll =
    | { status: 'notRolled' }
    | { status: 'skipped' }
    | (EncounterRollDetails & {
          status: Exclude<EncounterStatus, 'skipped'>;
      });

export function useEncounterRoll(
    locationName: string,
): EncounterRoll | undefined {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(locationName);

    if (encountersQuery.data === undefined) {
        return undefined;
    }

    const encounterRows = encountersQuery.data.encounters;
    const roll = game.encounters.find(
        (encounter) => encounter.location_name === locationName,
    );
    if (!roll) {
        return { status: 'notRolled' };
    }
    if (roll.status === 'skipped') {
        return { status: 'skipped' };
    }

    const originGroup = getEncounterGroupKey(roll.rolled_as);
    const matchingEncounters = encounterRows.filter(
        (encounter) => getEncounterGroupKey(encounter.name) === originGroup,
    );
    return {
        name: roll.rolled_as,
        activeName: roll.pokemon_name,
        status: roll.status,
        displayName: getEncounterGroupKey(roll.rolled_as),
        subAreaTerrains: matchingEncounters.map((encounter) => ({
            subArea: encounter.subArea,
            terrain: encounter.terrain,
        })),
        minLevel: Math.min(...matchingEncounters.map((e) => e.minLevel)),
        maxLevel: Math.max(...matchingEncounters.map((e) => e.maxLevel)),
        // "Joint" rate per time period: the best odds across all matching sub-area/terrain rows.
        morningRate: Math.max(...matchingEncounters.map((e) => e.morningRate)),
        dayRate: Math.max(...matchingEncounters.map((e) => e.dayRate)),
        eveningRate: Math.max(...matchingEncounters.map((e) => e.eveningRate)),
        nightRate: Math.max(...matchingEncounters.map((e) => e.nightRate)),
    };
}
