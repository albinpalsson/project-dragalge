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
    Tauros: {
        primary_type: 'fighting',
        secondary_type: '',
        base_hp: 75,
        base_attack: 110,
        base_defense: 105,
        base_sp_attack: 30,
        base_sp_defense: 70,
        base_speed: 100,
    },
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

    // Oinkologne: male is the base/default encounter form
    Oinkologne: {
        primary_type: 'normal',
        secondary_type: '',
        base_hp: 110,
        base_attack: 100,
        base_defense: 75,
        base_sp_attack: 59,
        base_sp_defense: 80,
        base_speed: 65,
    },
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
    'Oinkologne Male': {
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
    'Oinkologne Female': {
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

    // Lycanroc: three forms with genuinely different stats
    Lycanroc: {
        primary_type: 'rock',
        secondary_type: '',
        base_hp: 75,
        base_attack: 115,
        base_defense: 65,
        base_sp_attack: 55,
        base_sp_defense: 65,
        base_speed: 112,
    },
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
