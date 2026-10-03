const POKEMON_NAME_TRANSLATIONS: Readonly<Record<string, string>> =
    Object.freeze({
        Lycanroc: 'Lycanroc (Midday Form)',
        Oinkologne: 'Oinkologne Male',
        Toxtricity: 'Toxtricity (Amped Form)',
        Maushold: 'Maushold (Family of Four)',
        Dudunsparce: 'Dudunsparce (Two-Segment)',
        Deerling: 'Deerling (Spring Form)',
        Sawsbuck: 'Sawsbuck (Spring Form)',
        Shellos: 'Shellos (West Sea)',
        Gastrodon: 'Gastrodon (West Sea)',
        Basculin: 'Basculin (Red-Striped)',
        'Basculin Red': 'Basculin (Red-Striped)',
        'Basculin Blue': 'Basculin (Blue-Striped)',
        'Oinkologne (Male)': 'Oinkologne Male',
        'Oinkologne (Female)': 'Oinkologne Female',
        'Deerling Autumn Form': 'Deerling (Autumn Form)',
        'Sawsbuck Autumn Form': 'Sawsbuck (Autumn Form)',
    });

export function toCanonicalPokemonName(name: string): string {
    const normalizedName = name.normalize('NFC').trim();
    return POKEMON_NAME_TRANSLATIONS[normalizedName] ?? normalizedName;
}
