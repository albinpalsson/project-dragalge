export const SCHEMA_VERSION = '0.1.0-provisional';

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

export interface EvolutionMethodRow {
    id: number;
    description: string;
}

export interface EvolutionTransitionRow {
    from_pokemon_id: number;
    to_pokemon_id: number;
    method_id: number;
}

export interface LocationRow {
    id: string;
    name: string;
    region: string;
    province: string;
}

export interface AbilityRow {
    id: number;
    name: string;
    description: string;
}

export interface BossBattleRow {
    id: number;
    name: string;
    battle_type: string;
}

export interface BossBattlePokemonRow {
    boss_battle_id: number;
    pokemon_id: number;
    level: number;
    ability_id: number;
}

interface StaticPokemonDataDb {
    pokemon: PokemonRow;
    evolution_methods: EvolutionMethodRow;
    evolution_transitions: EvolutionTransitionRow;
    locations: LocationRow;
    abilities: AbilityRow;
    boss_battles: BossBattleRow;
    boss_battle_pokemon: BossBattlePokemonRow;
}

export interface LocationEncounterRow {
    id: number;
    sub_area: string;
    pokemon_id: number;
    games: string;
    terrain: string;
    min_level: number;
    max_level: number;
    morning_rate: number;
    day_rate: number;
    evening_rate: number;
    night_rate: number;
}

export type PokemonDataDb = StaticPokemonDataDb &
    Record<string, LocationEncounterRow>;
