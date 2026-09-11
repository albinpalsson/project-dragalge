import { getPokemonDb } from './client';
import type { LocationRow, PokemonDataDb } from '@pokedb2/pokemon-data';

export interface PokemonNameDto {
    name: string;
}

export interface LocationEncounterDetails {
    location: LocationRow;
    encounters: LocationEncounterView[];
}

export interface LocationEncounterView {
    name: string;
    subArea: string;
    games: string;
    terrain: string;
    minLevel: number;
    maxLevel: number;
    morningRate: number;
    dayRate: number;
    eveningRate: number;
    nightRate: number;
}

export interface PokemonBaseStats {
    hp: number;
    attack: number;
    defense: number;
    specialAttack: number;
    specialDefense: number;
    speed: number;
}

export interface TypeChartEntry {
    attackingType: string;
    defendingType: string;
    multiplier: number;
}

export interface PokemonView {
    name: string;
    primaryType: string;
    // Empty when the Pokémon is single-typed; the seed data stores type id 0 for "none".
    secondaryType: string;
    baseStats: PokemonBaseStats;
}

export interface BossMoveView {
    name: string;
    type: string;
    category: string;
    power: number;
    accuracy: number;
    effect: string;
}

export interface BossAbilityView {
    name: string;
    description: string;
}

export interface BossPokemonView {
    pokemonName: string;
    level: number;
    primaryType: string;
    secondaryType: string;
    baseStats: PokemonBaseStats;
    ability: BossAbilityView;
    moves: BossMoveView[];
}

export interface BossBattleRoster {
    battleName: string;
    battleType: string;
    pokemon: BossPokemonView[];
}

export async function getBossBattleRoster(
    battleName: string,
): Promise<BossBattleRoster | undefined> {
    const db = await getPokemonDb();

    // Fetch battle info
    const battle = await db
        .selectFrom('boss_battles')
        .selectAll()
        .where('name', '=', battleName)
        .executeTakeFirst();

    if (!battle) {
        return undefined;
    }

    const [rosterRows, moveRows] = await Promise.all([
        db
            .selectFrom('boss_battle_pokemon')
            .innerJoin(
                'pokemon',
                'boss_battle_pokemon.pokemon_id',
                'pokemon.id',
            )
            .selectAll()
            .where('boss_battle_id', '=', battle.id)
            .execute(),
        db
            .selectFrom('boss_battle_pokemon_moves')
            .innerJoin('moves', 'boss_battle_pokemon_moves.move_id', 'moves.id')
            .selectAll()
            .where('boss_battle_id', '=', battle.id)
            .execute(),
    ]);

    const abilityIds = Array.from(
        new Set(rosterRows.map((row) => row.ability_id)),
    );
    const typeIds = Array.from(
        new Set([
            ...rosterRows.map((row) => row.primary_type_id),
            ...rosterRows.map((row) => row.secondary_type_id),
            ...moveRows.map((row) => row.type_id),
        ]),
    );

    const [abilities, types] = await Promise.all([
        db
            .selectFrom('abilities')
            .selectAll()
            .where('id', 'in', abilityIds)
            .execute(),
        db
            .selectFrom('pokemon_types')
            .selectAll()
            .where('id', 'in', typeIds)
            .execute(),
    ]);

    const typeById = new Map(types.map((type) => [type.id, type.name]));
    const abilityById = new Map(
        abilities.map((ability) => [ability.id, ability]),
    );

    const roster: BossPokemonView[] = rosterRows.flatMap((rosterRow) => {
        const ability = abilityById.get(rosterRow.ability_id);
        if (!ability) {
            return [];
        }

        const pokemonMoves: BossMoveView[] = moveRows.flatMap((moveRow) => {
            if (moveRow.pokemon_slot !== rosterRow.slot) {
                return [];
            }

            return [
                {
                    name: moveRow.name,
                    type: typeById.get(moveRow.type_id) ?? 'unknown',
                    category: moveRow.category,
                    power: moveRow.power,
                    accuracy: moveRow.accuracy,
                    effect: moveRow.effect,
                },
            ];
        });

        return [
            {
                pokemonName: rosterRow.name,
                level: rosterRow.level,
                primaryType: typeById.get(rosterRow.primary_type_id) ?? '',
                secondaryType: typeById.get(rosterRow.secondary_type_id) ?? '',
                baseStats: {
                    hp: rosterRow.base_hp,
                    attack: rosterRow.base_attack,
                    defense: rosterRow.base_defense,
                    specialAttack: rosterRow.base_sp_attack,
                    specialDefense: rosterRow.base_sp_defense,
                    speed: rosterRow.base_speed,
                },
                ability: {
                    name: ability.name,
                    description: ability.description,
                },
                moves: pokemonMoves,
            },
        ];
    });

    return {
        battleName: battle.name,
        battleType: battle.battle_type,
        pokemon: roster,
    };
}

export async function getPokemon(
    name: string,
): Promise<PokemonView | undefined> {
    const db = await getPokemonDb();
    const row = await db
        .selectFrom('pokemon')
        .selectAll()
        .where('name', '=', name)
        .executeTakeFirst();

    if (!row) {
        return undefined;
    }

    const types = await db.selectFrom('pokemon_types').selectAll().execute();
    const typeById = new Map(types.map((type) => [type.id, type.name]));

    return {
        name: row.name,
        primaryType: typeById.get(row.primary_type_id) ?? '',
        secondaryType: typeById.get(row.secondary_type_id) ?? '',
        baseStats: {
            hp: row.base_hp,
            attack: row.base_attack,
            defense: row.base_defense,
            specialAttack: row.base_sp_attack,
            specialDefense: row.base_sp_defense,
            speed: row.base_speed,
        },
    };
}

export async function getTypeChart(): Promise<TypeChartEntry[]> {
    const db = await getPokemonDb();
    const [types, effectiveness] = await Promise.all([
        db.selectFrom('pokemon_types').selectAll().execute(),
        db.selectFrom('type_effectiveness').selectAll().execute(),
    ]);

    const typeById = new Map(types.map((type) => [type.id, type.name]));

    return effectiveness.map((entry) => ({
        attackingType: typeById.get(entry.attacking_type_id) ?? 'unknown',
        defendingType: typeById.get(entry.defending_type_id) ?? 'unknown',
        multiplier: entry.multiplier_pct / 100,
    }));
}

export async function getLocationEncounterDetails(
    locationName: string,
): Promise<LocationEncounterDetails> {
    const db = await getPokemonDb();
    const location = await db
        .selectFrom('locations')
        .selectAll()
        .where('name', '=', locationName)
        .executeTakeFirst();

    if (!location) {
        throw new Error(`Unknown location: ${locationName}`);
    }
    const encounterTable = location.id as keyof PokemonDataDb & string;

    const [rows, subAreas, terrains] = await Promise.all([
        db
            .selectFrom(encounterTable)
            .innerJoin('pokemon', `${encounterTable}.pokemon_id`, 'pokemon.id')
            .selectAll()
            .execute(),
        db.selectFrom('sub_areas').selectAll().execute(),
        db.selectFrom('terrain_types').selectAll().execute(),
    ]);
    const subAreaById = new Map(
        subAreas.map((subArea) => [subArea.id, subArea.name]),
    );
    const terrainById = new Map(
        terrains.map((terrain) => [terrain.id, terrain.key]),
    );

    return {
        location,
        encounters: rows.flatMap((row) => {
            return [
                {
                    name: row.name,
                    subArea: subAreaById.get(row.sub_area_id) ?? 'Unknown',
                    games: row.games,
                    terrain: terrainById.get(row.terrain_id) ?? 'unknown',
                    minLevel: row.min_level,
                    maxLevel: row.max_level,
                    morningRate: row.morning_rate,
                    dayRate: row.day_rate,
                    eveningRate: row.evening_rate,
                    nightRate: row.night_rate,
                },
            ];
        }),
    };
}
