const FORM_NAMES: Record<string, readonly string[]> = {
    'Wooper|Paldean Form': ['Wooper (Paldean Form)'],
    "Shellos|East Sea{{sup/9|S}} ''or'' West Sea{{sup/9|V}}": [
        'Shellos (East Sea)',
        'Shellos (West Sea)',
    ],
    'Sinistea|Phony Form': ['Sinistea (Phony Form)'],
    'Tauros|Paldean Form (Combat Breed)': ['Tauros (Combat Breed)'],
    "Gastrodon|East Sea{{sup/9|S}} ''or'' West Sea{{sup/9|V}}": [
        'Gastrodon (East Sea)',
        'Gastrodon (West Sea)',
    ],
    'Lycanroc|Midnight Form': ['Lycanroc (Midnight Form)'],
    'Lycanroc|Midday Form': ['Lycanroc (Midday Form)'],
    'Polteageist|Phony Form': ['Polteageist'],
    'Maushold|Family of Three': ['Maushold'],
    'Dudunsparce|Two-Segment Form': ['Dudunsparce'],
};

// Raid pages list gender-split species without a form.
const SPECIES_NAMES: Record<string, readonly string[]> = {
    Oinkologne: ['Oinkologne (Male)', 'Oinkologne (Female)'],
    Indeedee: ['Indeedee (Male)', 'Indeedee (Female)'],
};

export function parseTeraRaidPokemon(
    wikitext: string,
    pageName: string,
): string[] {
    const names = new Set<string>();
    for (const match of wikitext.matchAll(
        /^\{\{TeraRaidInfo\s*$([\s\S]*?)^\}\}/gm,
    )) {
        const pokemon = match[1].match(/^\|pokemon=(.+)$/m)?.[1].trim();
        if (!pokemon) {
            throw new Error(`[${pageName}] TeraRaidInfo is missing a pokemon`);
        }
        const form = match[1].match(/^\|form=(.+)$/m)?.[1].trim();
        if (form) {
            const mappedNames = FORM_NAMES[`${pokemon}|${form}`];
            if (!mappedNames) {
                throw new Error(
                    `[${pageName}] Unknown raid form: ${pokemon} (${form})`,
                );
            }
            for (const name of mappedNames) {
                names.add(name);
            }
        } else {
            for (const name of SPECIES_NAMES[pokemon] ?? [pokemon]) {
                names.add(name);
            }
        }
    }
    if (names.size === 0) {
        throw new Error(`[${pageName}] No TeraRaidInfo entries found`);
    }
    return [...names];
}
