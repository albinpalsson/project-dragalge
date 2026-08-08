export const SCHEMA_VERSION = '0.1.0-provisional';

export type BattleType = 'gym' | 'team_star' | 'special_pokemon';

export interface PokemonRow {
    id: number;
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

export interface EvolutionLinkRow {
    id: number;
    from_pokemon_id: number;
    to_pokemon_id: number;
    direction: string;
    notes: string;
}

export interface LocationRow {
    id: number;
    name: string;
    region: string;
}

export interface LocationEncounterRow {
    id: number;
    location_id: number;
    pokemon_id: number;
    encounter_rate: string;
    sub_region: string;
}

export interface BossBattleRow {
    id: number;
    name: string;
    battle_type: BattleType;
}

export interface BossBattlePokemonRow {
    id: number;
    boss_battle_id: number;
    pokemon_id: number;
    slot_order: number;
}

export interface PokemonDataDb {
    pokemon: PokemonRow;
    evolution_links: EvolutionLinkRow;
    locations: LocationRow;
    location_encounters: LocationEncounterRow;
    boss_battles: BossBattleRow;
    boss_battle_pokemon: BossBattlePokemonRow;
}
