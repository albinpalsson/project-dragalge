import type { BossBattlePokemonRow, BossBattleRow } from '../../schema.ts';

export interface BossSourceResult {
    battles: BossBattleRow[];
    assignments: BossBattlePokemonRow[];
}

export async function fetchAllBossBattles(): Promise<BossSourceResult> {
    const battles: BossBattleRow[] = [
        { id: 1, name: 'Katy', battle_type: 'gym' },
        { id: 2, name: 'Giacomo', battle_type: 'team_star' },
        { id: 3, name: 'Klawf', battle_type: 'special_pokemon' },
    ];

    const assignments: BossBattlePokemonRow[] = [
        { id: 1, boss_battle_id: 1, pokemon_id: 1, slot_order: 1 },
        { id: 2, boss_battle_id: 1, pokemon_id: 7, slot_order: 2 },
        { id: 3, boss_battle_id: 2, pokemon_id: 4, slot_order: 1 },
    ];

    return { battles, assignments };
}
