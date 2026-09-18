// CommonJS because the app bundler consumes node_modules packages as CJS (see artifacts/paldea-db.js).
// Seed data uses both "X (Form)" and "X Form" spellings for the same Pokémon, so both are listed.
const ICON_SLUG_OVERRIDES = {
    'Tauros (Combat Breed)': 'tauros-paldean-combat',
    'Tauros (Blaze Breed)': 'tauros-paldean-blaze',
    'Tauros (Aqua Breed)': 'tauros-paldean-aqua',
    'Wooper (Paldean Form)': 'wooper-paldean',
    'Oinkologne (Male)': 'oinkologne-male',
    'Oinkologne Male': 'oinkologne-male',
    'Oinkologne (Female)': 'oinkologne-female',
    'Oinkologne Female': 'oinkologne-female',
    'Indeedee (Male)': 'indeedee-male',
    'Indeedee (Female)': 'indeedee-female',
    'Lycanroc (Midday Form)': 'lycanroc-midday',
    'Lycanroc (Midnight Form)': 'lycanroc-midnight',
    'Lycanroc (Dusk Form)': 'lycanroc-dusk',
    'Basculin (Red-Striped)': 'basculin-red-striped',
    'Basculin Red': 'basculin-red-striped',
    'Basculin (Blue-Striped)': 'basculin-blue-striped',
    'Basculin Blue': 'basculin-blue-striped',
    'Deerling (Autumn Form)': 'deerling-autumn',
    'Deerling Autumn Form': 'deerling-autumn',
    'Deerling (Winter Form)': 'deerling-winter',
    'Sawsbuck (Autumn Form)': 'sawsbuck-autumn',
    'Sawsbuck Autumn Form': 'sawsbuck-autumn',
    'Sawsbuck (Winter Form)': 'sawsbuck-winter',
    'Nidoran\u2640': 'nidoran-f',
    'Nidoran\u2642': 'nidoran-m',
    'Mr. Mime': 'mr-mime',
    'Mr. Rime': 'mr-rime',
    "Farfetch'd": 'farfetchd',
    "Sirfetch'd": 'sirfetchd',
    'Type: Null': 'type-null',
    'Flab\u00e9b\u00e9': 'flabebe',
};

function toIconSlug(name) {
    const override = ICON_SLUG_OVERRIDES[name];
    if (override) {
        return override;
    }

    // Unlisted parenthetical forms fall back to the base form's icon.
    const slug = name
        .trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\([^)]*\)/g, ' ')
        .replace(/[.':]/g, '')
        .replace(/[\u2640]/g, 'f')
        .replace(/[\u2642]/g, 'm')
        .replace(/[^a-zA-Z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase();

    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
        throw new Error(`Unable to derive icon slug for pokemon name: ${name}`);
    }

    return slug;
}

exports.toIconSlug = toIconSlug;
