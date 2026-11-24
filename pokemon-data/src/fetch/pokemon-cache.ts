import type { EvolutionEdge } from './bulbapedia-parser.ts';

export interface CachedPokemonData {
    primary_type: string;
    secondary_type: string;
    base_hp: number;
    base_attack: number;
    base_defense: number;
    base_sp_attack: number;
    base_sp_defense: number;
    base_speed: number;
    // extensible: add evolution, ability fields here as needed
}

// Manual data for pokemon whose pages can't be reliably parsed (e.g. multi-form stat blocks)
export const POKEMON_CACHE: Record<string, CachedPokemonData | undefined> = {
    // Palafin's multi-form stat blocks require an explicit base (Zero Form) fallback.
    Palafin: {
        primary_type: 'water',
        secondary_type: '',
        base_hp: 100,
        base_attack: 70,
        base_defense: 72,
        base_sp_attack: 53,
        base_sp_defense: 62,
        base_speed: 100,
    },

    Krookodile: {
        primary_type: 'ground',
        secondary_type: 'dark',
        base_hp: 95,
        base_attack: 117,
        base_defense: 80,
        base_sp_attack: 65,
        base_sp_defense: 70,
        base_speed: 92,
    },

    Ursaluna: {
        primary_type: 'ground',
        secondary_type: 'normal',
        base_hp: 130,
        base_attack: 140,
        base_defense: 105,
        base_sp_attack: 45,
        base_sp_defense: 80,
        base_speed: 50,
    },

    Eevee: {
        primary_type: 'normal',
        secondary_type: '',
        base_hp: 55,
        base_attack: 55,
        base_defense: 50,
        base_sp_attack: 45,
        base_sp_defense: 65,
        base_speed: 55,
    },

    // All Paldean Tauros forms share the same base stats; only type differs
    'Tauros (Combat Breed)': {
        primary_type: 'fighting',
        secondary_type: '',
        base_hp: 75,
        base_attack: 110,
        base_defense: 105,
        base_sp_attack: 30,
        base_sp_defense: 70,
        base_speed: 100,
    },
    'Tauros (Blaze Breed)': {
        primary_type: 'fighting',
        secondary_type: 'fire',
        base_hp: 75,
        base_attack: 110,
        base_defense: 105,
        base_sp_attack: 30,
        base_sp_defense: 70,
        base_speed: 100,
    },
    'Tauros (Aqua Breed)': {
        primary_type: 'fighting',
        secondary_type: 'water',
        base_hp: 75,
        base_attack: 110,
        base_defense: 105,
        base_sp_attack: 30,
        base_sp_defense: 70,
        base_speed: 100,
    },

    // Paldean Wooper's page shares base Wooper's infobox type1/type2, which parseTypes can't distinguish
    'Wooper (Paldean Form)': {
        primary_type: 'poison',
        secondary_type: 'ground',
        base_hp: 55,
        base_attack: 45,
        base_defense: 45,
        base_sp_attack: 25,
        base_sp_defense: 25,
        base_speed: 15,
    },

    // Oinkologne: stats differ by gender
    'Oinkologne (Male)': {
        primary_type: 'normal',
        secondary_type: '',
        base_hp: 110,
        base_attack: 100,
        base_defense: 75,
        base_sp_attack: 59,
        base_sp_defense: 80,
        base_speed: 65,
    },
    'Oinkologne (Female)': {
        primary_type: 'normal',
        secondary_type: '',
        base_hp: 115,
        base_attack: 90,
        base_defense: 70,
        base_sp_attack: 59,
        base_sp_defense: 90,
        base_speed: 65,
    },

    // Base Rotom form (electric/ghost); appliance forms differ
    Rotom: {
        primary_type: 'electric',
        secondary_type: 'ghost',
        base_hp: 50,
        base_attack: 50,
        base_defense: 77,
        base_sp_attack: 95,
        base_sp_defense: 77,
        base_speed: 91,
    },

    // Rotom appliance forms: shared stats, different secondary type. Listed explicitly because
    // the scraper only knows Bulbapedia's "Heat Rotom" names and would fall back to base Rotom.
    'Rotom (Heat Form)': rotomApplianceForm('fire'),
    'Rotom (Wash Form)': rotomApplianceForm('water'),
    'Rotom (Frost Form)': rotomApplianceForm('ice'),
    'Rotom (Fan Form)': rotomApplianceForm('flying'),
    'Rotom (Mow Form)': rotomApplianceForm('grass'),

    // Oricorio: styles share stats; only type differs. Listed explicitly because the
    // scraper can't map "PomPom Style" to Bulbapedia's "Pom-Pom Style" and would
    // fall back to the base Fire/Flying typing.
    'Oricorio (Baile Style)': {
        primary_type: 'fire',
        secondary_type: 'flying',
        base_hp: 75,
        base_attack: 70,
        base_defense: 70,
        base_sp_attack: 98,
        base_sp_defense: 70,
        base_speed: 93,
    },
    'Oricorio (PomPom Style)': {
        primary_type: 'electric',
        secondary_type: 'flying',
        base_hp: 75,
        base_attack: 70,
        base_defense: 70,
        base_sp_attack: 98,
        base_sp_defense: 70,
        base_speed: 93,
    },

    "Oricorio (Pa'u Style)": {
        primary_type: 'psychic',
        secondary_type: 'flying',
        base_hp: 75,
        base_attack: 70,
        base_defense: 70,
        base_sp_attack: 98,
        base_sp_defense: 70,
        base_speed: 93,
    },
    'Oricorio (Sensu Style)': {
        primary_type: 'ghost',
        secondary_type: 'flying',
        base_hp: 75,
        base_attack: 70,
        base_defense: 70,
        base_sp_attack: 98,
        base_sp_defense: 70,
        base_speed: 93,
    },

    // Lycanroc: three forms with genuinely different stats
    'Lycanroc (Midday Form)': {
        primary_type: 'rock',
        secondary_type: '',
        base_hp: 75,
        base_attack: 115,
        base_defense: 65,
        base_sp_attack: 55,
        base_sp_defense: 65,
        base_speed: 112,
    },
    'Lycanroc (Midnight Form)': {
        primary_type: 'rock',
        secondary_type: '',
        base_hp: 85,
        base_attack: 115,
        base_defense: 75,
        base_sp_attack: 55,
        base_sp_defense: 75,
        base_speed: 82,
    },
    'Lycanroc (Dusk Form)': {
        primary_type: 'rock',
        secondary_type: '',
        base_hp: 75,
        base_attack: 117,
        base_defense: 65,
        base_sp_attack: 55,
        base_sp_defense: 65,
        base_speed: 110,
    },

    // Eiscue: Ice Face is the base encounter form
    Eiscue: {
        primary_type: 'ice',
        secondary_type: '',
        base_hp: 75,
        base_attack: 80,
        base_defense: 110,
        base_sp_attack: 65,
        base_sp_defense: 90,
        base_speed: 50,
    },

    // Indeedee: male and female have different stats
    'Indeedee (Male)': {
        primary_type: 'psychic',
        secondary_type: 'normal',
        base_hp: 60,
        base_attack: 65,
        base_defense: 55,
        base_sp_attack: 105,
        base_sp_defense: 95,
        base_speed: 95,
    },
    'Indeedee (Female)': {
        primary_type: 'psychic',
        secondary_type: 'normal',
        base_hp: 70,
        base_attack: 55,
        base_defense: 65,
        base_sp_attack: 95,
        base_sp_defense: 105,
        base_speed: 85,
    },
};

// Manual evolution edges for pokemon whose Bulbapedia prose names ('Paldean Wooper') don't
// match the encounter/cache key ('Wooper (Paldean Form)'), so narrative parsing drops the edge.
// Also pins base Wooper's edge, since narrative parsing elsewhere spuriously links it to Clodsire too.
// Oricorio changes style with a nectar and Rotom changes form with the Rotom Catalog, so every
// form "evolves" into every other form (see formChangeEdges).
const ORICORIO_STYLES = [
    'Oricorio (Baile Style)',
    'Oricorio (PomPom Style)',
    "Oricorio (Pa'u Style)",
    'Oricorio (Sensu Style)',
] as const;

const ROTOM_FORMS = [
    'Rotom',
    'Rotom (Heat Form)',
    'Rotom (Wash Form)',
    'Rotom (Frost Form)',
    'Rotom (Fan Form)',
    'Rotom (Mow Form)',
] as const;

export const POKEMON_EVOLUTION_OVERRIDES: Record<
    string,
    EvolutionEdge[] | undefined
> = {
    ...formChangeEdges(ORICORIO_STYLES, 'Nectar'),
    ...formChangeEdges(ROTOM_FORMS, 'Rotom Catalog'),
    Wooper: [{ from: 'Wooper', to: 'Quagsire', method: 'level 20' }],
    'Wooper (Paldean Form)': [
        { from: 'Wooper (Paldean Form)', to: 'Clodsire', method: 'level 20' },
    ],
    // Clodsire's own page has an Evobox template with name1=Wooper/form1=Paldean; parseEvoboxTemplate
    // ignores the form param, so fetching Clodsire's page spuriously yields a Wooper->Clodsire edge.
    // Clodsire is fully evolved, so this is always an empty list.
    Clodsire: [],
    // Applin's page uses a bespoke {{Evobox/Applin}} (evo1a/evo1b/evo1c params, no name params) that
    // parseEvolutionEdges doesn't recognize; the narrative fallback only finds Flapple. Without these
    // edges Appletun and Dipplin (and so Hydrapple) are never discovered or fetched.
    Applin: [
        { from: 'Applin', to: 'Flapple', method: 'Tart Apple' },
        { from: 'Applin', to: 'Appletun', method: 'Sweet Apple' },
        { from: 'Applin', to: 'Dipplin', method: 'Syrupy Apple' },
    ],
};

function rotomApplianceForm(secondaryType: string): CachedPokemonData {
    return {
        primary_type: 'electric',
        secondary_type: secondaryType,
        base_hp: 50,
        base_attack: 65,
        base_defense: 107,
        base_sp_attack: 105,
        base_sp_defense: 107,
        base_speed: 86,
    };
}

// Edges for a species that switches freely between forms with an item: each form gets an edge
// to every other form, so the box offers each one as an evolution path.
function formChangeEdges(
    forms: readonly string[],
    method: string,
): Record<string, EvolutionEdge[]> {
    return Object.fromEntries(
        forms.map((from) => [
            from,
            forms
                .filter((to) => to !== from)
                .map((to) => ({ from, to, method })),
        ]),
    );
}
