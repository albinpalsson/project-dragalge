
export interface PokemonData {
    name: string;
    primary_type: string;
    secondary_type: string;
    base_hp: number;
    base_attack: number;
    base_defense: number;
    base_sp_attack: number;
    base_sp_defense: number;
    base_speed: number;
}

export async function fetchPokemonData(
    name: string,
): Promise<PokemonData> {
    return {
        name,
        primary_type: '',
        secondary_type: '',
        base_hp: 0,
        base_attack: 0,
        base_defense: 0,
        base_sp_attack: 0,
        base_sp_defense: 0,
        base_speed: 0,
    };
}
