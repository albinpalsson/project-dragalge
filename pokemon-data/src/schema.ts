export const SCHEMA_VERSION = '0.1.0-provisional';

export interface PokemonRow {
    id: number;
    name: string;
    primary_type_id: number;
    secondary_type_id: number;
    base_hp: number;
    base_attack: number;
    base_defense: number;
    base_sp_attack: number;
    base_sp_defense: number;
    base_speed: number;
}

export interface PokemonTypeRow {
    id: number;
    name: string;
}

export interface TerrainTypeRow {
    id: number;
    key: string;
}

export interface SubAreaRow {
    id: number;
    name: string;
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
    slot: number;
    pokemon_id: number;
    level: number;
    ability_id: number;
}

export interface MoveRow {
    id: number;
    name: string;
    type_id: number;
    category: string;
    power: number;
    accuracy: number;
    effect: string;
}

export interface BossBattlePokemonMoveRow {
    boss_battle_id: number;
    pokemon_slot: number;
    move_slot: number;
    move_id: number;
}

interface StaticPokemonDataDb {
    pokemon: PokemonRow;
    pokemon_types: PokemonTypeRow;
    sub_areas: SubAreaRow;
    terrain_types: TerrainTypeRow;
    evolution_methods: EvolutionMethodRow;
    evolution_transitions: EvolutionTransitionRow;
    locations: LocationRow;
    abilities: AbilityRow;
    boss_battles: BossBattleRow;
    boss_battle_pokemon: BossBattlePokemonRow;
    moves: MoveRow;
    boss_battle_pokemon_moves: BossBattlePokemonMoveRow;
}

export interface LocationEncounterRow {
    sub_area_id: number;
    pokemon_id: number;
    games: string;
    terrain_id: number;
    min_level: number;
    max_level: number;
    morning_rate: number;
    day_rate: number;
    evening_rate: number;
    night_rate: number;
}

export type PokemonDataDb = StaticPokemonDataDb &
    Record<string, LocationEncounterRow>;
