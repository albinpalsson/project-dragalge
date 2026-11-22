import type { MilestoneEntry, MilestoneSnapshot } from './plan-types';

/** Icons shown per milestone. */
export const SHOWCASE_SIZE = 6;
/**
 * A Pokémon shown at earlier milestones is this many times as likely to be
 * picked again, compounding for every earlier milestone it was shown at, so the
 * rows read like one team growing over the run.
 */
const CARRY_WEIGHT = 2;
/**
 * Strong Pokémon are more likely to be picked. Among the Pokémon possible at a
 * milestone, the weakest keeps weight 1 and the strongest gets this, growing
 * exponentially by base stat total in between.
 */
const MAX_STAT_WEIGHT = 10;

/**
 * Picks the icons to show for each milestone, in order: as many as the player
 * has in the box by then, at most SHOWCASE_SIZE. A certain starter always comes
 * first; the rest are sampled without
 * replacement from the possible Pokémon, weighted towards those already shown
 * at earlier milestones.
 */
export function pickShowcase(
    milestones: readonly MilestoneSnapshot[],
): Map<string, MilestoneEntry[]> {
    const random = Math.random;
    const appearances = new Map<string, number>();
    const result = new Map<string, MilestoneEntry[]>();

    for (const milestone of milestones) {
        const remaining = [...milestone.entries];
        const shown: MilestoneEntry[] = [];
        // Never more icons than Pokémon the player has in the box by then.
        const limit = Math.min(SHOWCASE_SIZE, milestone.boxCount);
        // The starter is on every team, so it is not left to chance.
        const starterIndex = remaining.findIndex((entry) => entry.isStarter);
        if (starterIndex >= 0 && limit > 0) {
            shown.push(...remaining.splice(starterIndex, 1));
        }
        // Strength is relative to what is possible at this milestone.
        const strengths = milestone.entries.map((entry) => entry.strength);
        const weakest = Math.min(...strengths);
        const range = Math.max(...strengths) - weakest;
        while (shown.length < limit && remaining.length > 0) {
            const weights = remaining.map(
                (entry) =>
                    CARRY_WEIGHT ** (appearances.get(entry.speciesKey) ?? 0) *
                    MAX_STAT_WEIGHT **
                        (range > 0 ? (entry.strength - weakest) / range : 0),
            );
            let roll =
                random() * weights.reduce((sum, weight) => sum + weight, 0);
            let index = 0;
            while (index < remaining.length - 1 && roll >= weights[index]) {
                roll -= weights[index];
                index += 1;
            }
            shown.push(...remaining.splice(index, 1));
        }
        for (const entry of shown) {
            appearances.set(
                entry.speciesKey,
                (appearances.get(entry.speciesKey) ?? 0) + 1,
            );
        }
        result.set(milestone.id, shown);
    }
    return result;
}
