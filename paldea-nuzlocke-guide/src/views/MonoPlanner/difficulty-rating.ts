export type RunDifficulty = 'hard' | 'medium' | 'ok';

export interface RunRating {
    level: RunDifficulty;
    /** Which end of the fights ranking the type is closer to. */
    end: 'hardest' | 'easiest';
    /** Place counted from that end, 1-based; tied types share a place. */
    place: number;
    /** Other types with the same points. */
    tiedWith: number;
    /** The encounter count, not the fights, set the level. */
    fewEncounters: boolean;
}

/** What `rateRun` needs from each type's plan summary. */
export interface RunSummary {
    red: number;
    orange: number;
    totalEncounters: number;
}

/** A Hard fight weighs more than a Tricky one. */
const HARD_FIGHT_POINTS = 2;
const TRICKY_FIGHT_POINTS = 1;

/** The hardest share of the types is rated Hard, the next share Medium. */
const HARD_SHARE = 0.3;
const MEDIUM_SHARE = 0.35;

/** Fewer encounters than this make a run at least Medium, or Hard below the second. */
const GOOD_ENCOUNTERS = 14;
const TRICKY_ENCOUNTERS = 10;

const LEVEL_ORDER: readonly RunDifficulty[] = ['ok', 'medium', 'hard'];

/**
 * Rates one type against all the others by their Hard and Tricky fights, so
 * the label tells how the run compares rather than how it does on its own.
 * Ties take the middle of the positions they cover, which keeps a group of
 * equally hard types together instead of splitting them arbitrarily. A run
 * with few encounters is rated at least as hard as its encounter count says.
 */
export function rateRun(
    summaries: ReadonlyMap<string, RunSummary>,
    type: string,
): RunRating | undefined {
    const summary = summaries.get(type);
    if (!summary) {
        return undefined;
    }
    const own = getPoints(summary);
    const values = [...summaries.values()].map(getPoints);
    const total = values.length;
    const harder = values.filter((value) => value > own).length;
    const tied = values.filter((value) => value === own).length;
    const easier = total - harder - tied;
    // Position counted from the hardest, 0-based.
    const position = harder + (tied - 1) / 2;

    let fightsLevel: RunDifficulty = 'ok';
    if (position < total * HARD_SHARE) {
        fightsLevel = 'hard';
    } else if (position < total * (HARD_SHARE + MEDIUM_SHARE)) {
        fightsLevel = 'medium';
    }
    let encountersLevel: RunDifficulty = 'ok';
    if (summary.totalEncounters < TRICKY_ENCOUNTERS) {
        encountersLevel = 'hard';
    } else if (summary.totalEncounters < GOOD_ENCOUNTERS) {
        encountersLevel = 'medium';
    }
    const fewEncounters =
        LEVEL_ORDER.indexOf(encountersLevel) > LEVEL_ORDER.indexOf(fightsLevel);
    const nearHardest = position <= (total - 1) / 2;
    return {
        level: fewEncounters ? encountersLevel : fightsLevel,
        end: nearHardest ? 'hardest' : 'easiest',
        place: (nearHardest ? harder : easier) + 1,
        tiedWith: tied - 1,
        fewEncounters,
    };
}

function getPoints(summary: RunSummary): number {
    return (
        summary.red * HARD_FIGHT_POINTS + summary.orange * TRICKY_FIGHT_POINTS
    );
}
