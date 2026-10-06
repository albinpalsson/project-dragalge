export const SPECIES_FORMS: Readonly<Record<string, readonly string[]>> = {
    Basculin: ['Basculin (Red-Striped)', 'Basculin (Blue-Striped)'],
    Deerling: seasonForms('Deerling'),
    Sawsbuck: seasonForms('Sawsbuck'),
    Squawkabilly: [
        'Squawkabilly (Green Plumage)',
        'Squawkabilly (Blue Plumage)',
        'Squawkabilly (Yellow Plumage)',
        'Squawkabilly (White Plumage)',
    ],
    Shellos: ['Shellos (East Sea)', 'Shellos (West Sea)'],
    Gastrodon: ['Gastrodon (East Sea)', 'Gastrodon (West Sea)'],
    'Flab\u00e9b\u00e9': flowerForms('Flab\u00e9b\u00e9'),
    Floette: flowerForms('Floette'),
    Florges: flowerForms('Florges'),
    Pyroar: ['Pyroar (Male)', 'Pyroar (Female)'],
    Vivillon: ['Vivillon (Fancy Pattern)'],
    Sinistea: ['Sinistea (Phony Form)', 'Sinistea (Antique Form)'],
    Tatsugiri: [
        'Tatsugiri (Curly Form)',
        'Tatsugiri (Droopy Form)',
        'Tatsugiri (Stretchy Form)',
    ],
    Rockruff: ['Rockruff (Own Tempo)'],
};

const speciesByForm = new Map(
    Object.entries(SPECIES_FORMS).flatMap(([species, forms]) =>
        forms.map((form) => [form, species] as const),
    ),
);

export function getEncounterGroupKey(pokemonName: string): string {
    return speciesByForm.get(pokemonName) ?? pokemonName;
}

export function pickEncounterSpecies(
    pokemonName: string,
    random: () => number = Math.random,
): string {
    const forms = SPECIES_FORMS[pokemonName];
    return forms?.length
        ? forms[Math.floor(random() * forms.length)]
        : pokemonName;
}

function seasonForms(species: string): string[] {
    return ['Spring', 'Summer', 'Autumn', 'Winter'].map(
        (season) => `${species} (${season} Form)`,
    );
}

function flowerForms(species: string): string[] {
    return ['Red', 'Yellow', 'Orange', 'Blue', 'White'].map(
        (color) => `${species} (${color} Flower)`,
    );
}
