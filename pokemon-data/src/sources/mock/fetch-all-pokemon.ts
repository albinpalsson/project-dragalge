import type { PokemonRow } from '../../schema.ts';

export async function fetchAllPokemon(): Promise<PokemonRow[]> {
    return [
        {
            id: 1,
            name: 'Sprigatito',
            primary_type: 'Grass',
            secondary_type: '',
            base_hp: 40,
            base_attack: 61,
            base_defense: 54,
            base_sp_attack: 45,
            base_sp_defense: 45,
            base_speed: 65,
        },
        {
            id: 4,
            name: 'Fuecoco',
            primary_type: 'Fire',
            secondary_type: '',
            base_hp: 67,
            base_attack: 45,
            base_defense: 59,
            base_sp_attack: 63,
            base_sp_defense: 40,
            base_speed: 36,
        },
        {
            id: 7,
            name: 'Quaxly',
            primary_type: 'Water',
            secondary_type: '',
            base_hp: 55,
            base_attack: 65,
            base_defense: 45,
            base_sp_attack: 50,
            base_sp_defense: 45,
            base_speed: 50,
        },
    ];
}
