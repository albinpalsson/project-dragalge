export interface RandomizerMergeGroup {
    key: string;
    members: readonly string[];
}

// The seed data spells several variants two ways, so every spelling is listed as a member.
// These groups are scoped to randomizer rolls only; display/icon resolution is a separate concern.
export const RANDOMIZER_MERGE_GROUPS: readonly RandomizerMergeGroup[] = [
    {
        key: 'basculin',
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
        members: [
            'Deerling',
            'Deerling (Autumn Form)',
            'Deerling (Winter Form)',
            'Deerling Autumn Form',
        ],
    },
    {
        key: 'flabebe',
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
        members: ['Gastrodon', 'Gastrodon (East Sea)', 'Gastrodon (West Sea)'],
    },
    {
        key: 'indeedee',
        members: ['Indeedee', 'Indeedee (Female)', 'Indeedee (Male)'],
    },
    {
        key: 'lycanroc',
        members: [
            'Lycanroc',
            'Lycanroc (Dusk Form)',
            'Lycanroc (Midday Form)',
            'Lycanroc (Midnight Form)',
        ],
    },
    {
        key: 'oinkologne',
        members: [
            'Oinkologne',
            'Oinkologne (Female)',
            'Oinkologne (Male)',
            'Oinkologne Female',
            'Oinkologne Male',
        ],
    },
    {
        key: 'pyroar',
        members: ['Pyroar', 'Pyroar (Female)', 'Pyroar (Male)'],
    },
    {
        key: 'rockruff',
        members: ['Rockruff', 'Rockruff (Own Tempo)'],
    },
    {
        key: 'sawsbuck',
        members: [
            'Sawsbuck',
            'Sawsbuck (Autumn Form)',
            'Sawsbuck (Winter Form)',
            'Sawsbuck Autumn Form',
        ],
    },
    {
        key: 'shellos',
        members: ['Shellos', 'Shellos (East Sea)', 'Shellos (West Sea)'],
    },
    {
        key: 'sinistea',
        members: [
            'Sinistea',
            'Sinistea (Antique Form)',
            'Sinistea (Phony Form)',
        ],
    },
    {
        key: 'squawkabilly',
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
        members: [
            'Tatsugiri',
            'Tatsugiri (Curly Form)',
            'Tatsugiri (Droopy Form)',
            'Tatsugiri (Stretchy Form)',
        ],
    },
    {
        key: 'tauros',
        members: [
            'Tauros',
            'Tauros (Aqua Breed)',
            'Tauros (Blaze Breed)',
            'Tauros (Combat Breed)',
        ],
    },
    {
        key: 'toxtricity',
        members: [
            'Toxtricity',
            'Toxtricity (Amped Form)',
            'Toxtricity (Low Key Form)',
        ],
    },
    {
        key: 'vivillon',
        members: ['Vivillon', 'Vivillon (Fancy Pattern)'],
    },
    {
        key: 'wooper',
        members: ['Wooper', 'Wooper (Paldean Form)'],
    },
];

const GROUP_KEY_BY_MEMBER = new Map<string, string>(
    RANDOMIZER_MERGE_GROUPS.flatMap((group) =>
        group.members.map((member) => [member, group.key] as const),
    ),
);

/** Names outside any merge group are their own group, keyed by the name itself. */
export function getRandomizerGroupKey(name: string): string {
    return GROUP_KEY_BY_MEMBER.get(name) ?? name;
}
