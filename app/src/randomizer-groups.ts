export interface RandomizerMergeGroup {
    key: string;
    displayName: string;
    members: readonly string[];
}

// The seed data spells several variants two ways, so every spelling is listed as a member.
export const RANDOMIZER_MERGE_GROUPS: readonly RandomizerMergeGroup[] = [
    {
        key: 'basculin',
        displayName: 'Basculin',
        members: [
            'Basculin',
            'Basculin (Blue-Striped)',
            'Basculin (Red-Striped)',
            'Basculin Blue',
            'Basculin Red',
        ],
    },
    {
        key: 'deerling',
        displayName: 'Deerling',
        members: [
            'Deerling',
            'Deerling (Autumn Form)',
            'Deerling (Winter Form)',
            'Deerling Autumn Form',
        ],
    },
    {
        key: 'flabebe',
        displayName: 'Flabébé',
        members: [
            'Flabébé',
            'Flabébé (Blue Flower)',
            'Flabébé (Orange Flower)',
            'Flabébé (Red Flower)',
            'Flabébé (White Flower)',
            'Flabébé (Yellow Flower)',
        ],
    },
    {
        key: 'floette',
        displayName: 'Floette',
        members: [
            'Floette',
            'Floette (Blue Flower)',
            'Floette (Orange Flower)',
            'Floette (Red Flower)',
            'Floette (White Flower)',
            'Floette (Yellow Flower)',
        ],
    },
    {
        key: 'florges',
        displayName: 'Florges',
        members: [
            'Florges (Blue Flower)',
            'Florges (Orange Flower)',
            'Florges (Red Flower)',
            'Florges (White Flower)',
            'Florges (Yellow Flower)',
        ],
    },
    {
        key: 'gastrodon',
        displayName: 'Gastrodon',
        members: ['Gastrodon', 'Gastrodon (East Sea)', 'Gastrodon (West Sea)'],
    },
    {
        key: 'pyroar',
        displayName: 'Pyroar',
        members: ['Pyroar', 'Pyroar (Female)', 'Pyroar (Male)'],
    },
    {
        key: 'rockruff',
        displayName: 'Rockruff',
        members: ['Rockruff', 'Rockruff (Own Tempo)'],
    },
    {
        key: 'sawsbuck',
        displayName: 'Sawsbuck',
        members: [
            'Sawsbuck',
            'Sawsbuck (Autumn Form)',
            'Sawsbuck (Winter Form)',
            'Sawsbuck Autumn Form',
        ],
    },
    {
        key: 'shellos',
        displayName: 'Shellos',
        members: ['Shellos', 'Shellos (East Sea)', 'Shellos (West Sea)'],
    },
    {
        key: 'sinistea',
        displayName: 'Sinistea',
        members: [
            'Sinistea',
            'Sinistea (Antique Form)',
            'Sinistea (Phony Form)',
        ],
    },
    {
        key: 'squawkabilly',
        displayName: 'Squawkabilly',
        members: [
            'Squawkabilly',
            'Squawkabilly (Blue Plumage)',
            'Squawkabilly (Green Plumage)',
            'Squawkabilly (White Plumage)',
            'Squawkabilly (Yellow Plumage)',
        ],
    },
    {
        key: 'tatsugiri',
        displayName: 'Tatsugiri',
        members: [
            'Tatsugiri',
            'Tatsugiri (Curly Form)',
            'Tatsugiri (Droopy Form)',
            'Tatsugiri (Stretchy Form)',
        ],
    },
    {
        key: 'vivillon',
        displayName: 'Vivillon',
        members: ['Vivillon', 'Vivillon (Fancy Pattern)'],
    },
    {
        key: 'wooper',
        displayName: 'Wooper',
        members: ['Wooper', 'Wooper (Paldean Form)'],
    },
];

const GROUP_KEY_BY_MEMBER = new Map<string, string>(
    RANDOMIZER_MERGE_GROUPS.flatMap((group) =>
        group.members.map((member) => [member, group.key] as const),
    ),
);

const GROUP_BY_KEY = new Map<string, RandomizerMergeGroup>(
    RANDOMIZER_MERGE_GROUPS.map((group) => [group.key, group] as const),
);

/** Names outside any merge group are their own group, keyed by the name itself. */
export function getRandomizerGroupKey(name: string): string {
    return GROUP_KEY_BY_MEMBER.get(name) ?? name;
}

/** Names outside any merge group keep their original display name. */
export function getRandomizerDisplayName(name: string): string {
    const groupKey = GROUP_KEY_BY_MEMBER.get(name);
    if (!groupKey) {
        return name;
    }
    return GROUP_BY_KEY.get(groupKey)?.displayName ?? name;
}
