/**
 * The points of the run the overview shows a possible team for. Each key is a
 * progression key of a boss in `BOSS_CONFIGS`; the team is everything
 * obtainable before that fight.
 */
export interface MilestoneConfig {
    id: string;
    label: string;
    key: string;
    /**
     * Used instead of `key` when the milestone has this many Pokémon or fewer,
     * since a first gym with almost nothing to show is not a useful snapshot.
     */
    fallback?: { key: string; label: string; whenAtMost: number };
}

export const MILESTONES: readonly MilestoneConfig[] = [
    {
        id: 'second-rival',
        label: 'Second rival battle',
        key: 'nemona-south-province',
    },
    {
        id: 'first-gym',
        label: 'First gym battle',
        key: 'katy-bug-gym',
        fallback: {
            key: 'brassius-grass-gym',
            label: 'Second gym battle',
            whenAtMost: 2,
        },
    },
    {
        id: 'midway',
        label: 'Halfway (fourth gym)',
        key: 'kofu-water-gym',
    },
    {
        // The last Elite Four fight stands in for Geeta: no encounters sit
        // between them, so the team is the same.
        id: 'champion',
        label: 'Champion',
        key: 'hassel-elite-four',
    },
];

/** Every progression key a snapshot has to be taken at. */
export const MILESTONE_KEYS: ReadonlySet<string> = new Set(
    MILESTONES.flatMap((milestone) => [
        milestone.key,
        ...(milestone.fallback ? [milestone.fallback.key] : []),
    ]),
);
