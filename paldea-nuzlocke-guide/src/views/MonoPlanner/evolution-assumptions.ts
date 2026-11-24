/*
 * Evolutions that are not plain "level N" but that a mono run can reasonably
 * use. The evolution data only has free-text methods for these, so the
 * planner uses this table instead. They are assumptions, not game data: change
 * them here to move when an evolution becomes available.
 */

export interface AssumedEvolution {
    to: string;
    /** Level the Pokémon must reach before it can evolve, 0 for none. */
    level: number;
    /**
     * Progression key (see PROGRESSION_ITEMS) that unlocks the evolution. It is
     * available at every boss after that item. Omitted means always available.
     */
    availableAfter?: string;
    /** Game version this evolution is limited to. Omitted means both. */
    variant?: 's' | 'v';
}

/**
 * Progression key after which each evolution stone can be had. A Pokémon
 * evolves by stone as soon as its stone is available, like a level-up
 * evolution.
 */
const STONE_AVAILABLE_AFTER: Record<string, string> = {
    Fire: 'iono-electric-gym',
    Water: 'iono-electric-gym',
    Thunder: 'iono-electric-gym',
    Leaf: 'klawf-stony-cliff-titan',
    Moon: 'klawf-stony-cliff-titan',
    Sun: 'klawf-stony-cliff-titan',
    Shiny: 'great-tusk-quaking-earth-titan',
    Dusk: 'larry-normal-gym',
    Dawn: 'dalizapa-passage',
    Ice: 'glaseado-mountain',
};

/** E.g. "Leaf Stone" in "Leaf Stone VIII or Level up near Moss Rock". */
const STONE_METHOD = /\b(\w+) Stone\b/;

/**
 * The progression key that unlocks an evolution method's stone, or undefined
 * when the method needs no evolution stone.
 */
export function getStoneAvailableAfter(method: string): string | undefined {
    const stone = STONE_METHOD.exec(method)?.[1];
    return stone ? STONE_AVAILABLE_AFTER[stone] : undefined;
}

/**
 * Progression key after which a form-change item can be had, keyed by the
 * evolution method it appears as.
 */
const FORM_CHANGE_AVAILABLE_AFTER: Record<string, string> = {
    Nectar: 'iono-electric-gym',
    'Rotom Catalog': 'orthworm-lurking-steel-titan',
};

export function getFormChangeAvailableAfter(
    method: string,
): string | undefined {
    return FORM_CHANGE_AVAILABLE_AFTER[method];
}

/** Keyed by the Pokémon that evolves. */
export const ASSUMED_EVOLUTIONS: Record<string, readonly AssumedEvolution[]> = {
    Eevee: [
        { to: 'Espeon', level: 0 },
        { to: 'Umbreon', level: 0 },
        { to: 'Sylveon', level: 15 },
    ],
    Primeape: [{ to: 'Annihilape', level: 35 }],
    Bonsly: [{ to: 'Sudowoodo', level: 17 }],
    Steenee: [{ to: 'Tsareena', level: 29 }],
    Dunsparce: [{ to: 'Dudunsparce', level: 33 }],
    Girafarig: [{ to: 'Farigiraf', level: 33 }],
    Applin: [
        { to: 'Flapple', level: 0, availableAfter: 'iono-electric-gym' },
        { to: 'Appletun', level: 0, availableAfter: 'iono-electric-gym' },
    ],
    Sneasel: [{ to: 'Weavile', level: 0, availableAfter: 'kofu-water-gym' }],
    Happiny: [{ to: 'Chansey', level: 0, availableAfter: 'casseroya-lake' }],
    Charcadet: [
        {
            to: 'Armarouge',
            level: 0,
            availableAfter: 'east-province-area-three',
            variant: 's',
        },
        {
            to: 'Ceruledge',
            level: 0,
            availableAfter: 'east-province-area-three',
            variant: 'v',
        },
    ],
};
