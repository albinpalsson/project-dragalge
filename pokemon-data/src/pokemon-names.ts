// Size forms with identical stats, kept as a single species row.
const COLLAPSED_SPECIES: ReadonlySet<string> = new Set([
    'Maushold',
    'Dudunsparce',
]);

export function toCanonicalPokemonName(name: string): string {
    const normalizedName = name.normalize('NFC').trim();
    if (normalizedName === 'Lycanroc') {
        return 'Lycanroc (Midday Form)';
    }
    const species = normalizedName.replace(/\s*\([^)]*\)$/, '');
    return COLLAPSED_SPECIES.has(species) ? species : normalizedName;
}
