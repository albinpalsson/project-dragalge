/**
 * Maps starter Pokémon to their corresponding first rival battle with Nemona.
 * Nemona uses the starter strong against the player's choice (type advantage).
 */

const STARTER_BATTLE_MAP: Record<string, string> = {
    Sprigatito: 'Nemona (Second Battle - Fuecoco)',
    Fuecoco: 'Nemona (Second Battle - Quaxly)',
    Quaxly: 'Nemona (Second Battle - Sprigatito)',
};

export function getStarterBattleName(starterName: string): string | undefined {
    return STARTER_BATTLE_MAP[starterName];
}
