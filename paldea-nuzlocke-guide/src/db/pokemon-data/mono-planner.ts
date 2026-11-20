import { getPokemonDb } from './client';
import {
    type BossBattleRoster,
    getBossBattleRoster,
    getLocationEncounterDetails,
    type LocationEncounterDetails,
} from './queries';

// Queries used only by the mono type planner (views/MonoPlanner). Import this
// module from that folder only, so it stays in the planner's lazy chunk.

/** Encounter details for several locations, in the order of `locationNames`. */
export async function getEncounterDetailsForLocations(
    locationNames: readonly string[],
): Promise<LocationEncounterDetails[]> {
    return Promise.all(locationNames.map(getLocationEncounterDetails));
}

export async function getBossBattleRosters(
    battleNames: readonly string[],
): Promise<BossBattleRoster[]> {
    const rosters = await Promise.all(battleNames.map(getBossBattleRoster));
    return rosters.filter((roster) => roster !== undefined);
}

/** Base stat total by Pokémon name. */
export async function getBaseStatTotals(): Promise<Record<string, number>> {
    const db = await getPokemonDb();
    const rows = await db.selectFrom('pokemon').selectAll().execute();
    return Object.fromEntries(
        rows.map((row) => [
            row.name,
            row.base_hp +
                row.base_attack +
                row.base_defense +
                row.base_sp_attack +
                row.base_sp_defense +
                row.base_speed,
        ]),
    );
}
