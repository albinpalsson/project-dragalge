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

export interface EvolutionLinkRow {
    id: number;
    from_pokemon_id: number;
    to_pokemon_id: number;
    direction: string;
    notes: string;
}

export interface LocationRow {
    id: string;
    name: string;
    region: string;
    province: string;
}

export interface BossBattleRow {
    id: number;
    name: string;
    battle_type: string;
}

export interface BossBattlePokemonRow {
    id: number;
    boss_battle_id: number;
    pokemon_id: number;
    slot_order: number;
}

interface StaticPokemonDataDb {
    pokemon: PokemonRow;
    evolution_links: EvolutionLinkRow;
    locations: LocationRow;
    boss_battles: BossBattleRow;
    boss_battle_pokemon: BossBattlePokemonRow;
}

export interface LocationEncounterRow {
    id: number;
    sub_area: string;
    pokemon_name: string;
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
