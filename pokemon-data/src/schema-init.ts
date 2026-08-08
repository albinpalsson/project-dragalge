import { DB } from '@pokedb2/db';

export const PROVISIONAL_SCHEMA_SQL: readonly string[] = [
    'CREATE TABLE pokemon (id INT, name CHAR(64), primary_type CHAR(24), secondary_type CHAR(24), base_hp INT, base_attack INT, base_defense INT, base_sp_attack INT, base_sp_defense INT, base_speed INT)',
    'CREATE TABLE evolution_links (id INT, from_pokemon_id INT, to_pokemon_id INT, direction CHAR(16), notes CHAR(96))',
    'CREATE TABLE locations (id INT, name CHAR(96), region CHAR(64))',
    'CREATE TABLE location_encounters (id INT, location_id INT, pokemon_id INT, encounter_rate CHAR(24), sub_region CHAR(96))',
    'CREATE TABLE boss_battles (id INT, name CHAR(96), battle_type CHAR(24))',
    'CREATE TABLE boss_battle_pokemon (id INT, boss_battle_id INT, pokemon_id INT, slot_order INT)',
];

export function applyProvisionalSchema(db: DB): void {
    for (const sql of PROVISIONAL_SCHEMA_SQL) {
        db.execute(sql, []);
    }
}
