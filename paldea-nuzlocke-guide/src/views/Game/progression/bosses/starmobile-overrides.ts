import type {
    BossBattleRoster,
    PokemonBaseStats,
} from '../../../../db/pokemon-data/queries';
import type { BossRosterView } from './BossRoster';

interface StarmobileOverride {
    displayName: string;
    primaryType: string;
    actualStats: PokemonBaseStats;
}

export const STARMOBILE_OVERRIDES = {
    'Giacomo (Dark Star)': {
        displayName: 'Segin Starmobile',
        primaryType: 'dark',
        actualStats: {
            hp: 160,
            attack: 36,
            defense: 47,
            specialAttack: 35,
            specialDefense: 38,
            speed: 129,
        },
    },
    'Mela (Fire Star)': {
        displayName: 'Schedar Starmobile',
        primaryType: 'fire',
        actualStats: {
            hp: 204,
            attack: 49,
            defense: 60,
            specialAttack: 29,
            specialDefense: 51,
            speed: 128,
        },
    },
    'Atticus (Poison Star)': {
        displayName: 'Navi Starmobile',
        primaryType: 'poison',
        actualStats: {
            hp: 252,
            attack: 60,
            defense: 80,
            specialAttack: 50,
            specialDefense: 70,
            speed: 130,
        },
    },
    'Ortega (Fairy Star)': {
        displayName: 'Ruchbah Starmobile',
        primaryType: 'fairy',
        actualStats: {
            hp: 380,
            attack: 90,
            defense: 120,
            specialAttack: 70,
            specialDefense: 90,
            speed: 132,
        },
    },
    'Eri (Fighting Star)': {
        displayName: 'Caph Starmobile',
        primaryType: 'fighting',
        actualStats: {
            hp: 408,
            attack: 95,
            defense: 120,
            specialAttack: 80,
            specialDefense: 85,
            speed: 131,
        },
    },
} satisfies Record<string, StarmobileOverride>;

export function applyStarmobileOverride(
    roster: BossBattleRoster,
    override: StarmobileOverride,
): BossRosterView {
    const aceSlot = Math.max(...roster.pokemon.map((pokemon) => pokemon.slot));
    const ace = roster.pokemon.find((pokemon) => pokemon.slot === aceSlot);
    if (ace?.pokemonName !== 'Revavroom') {
        throw new Error(`Expected a Revavroom ace for ${roster.battleName}.`);
    }

    return {
        ...roster,
        pokemon: roster.pokemon.map((pokemon) =>
            pokemon.slot === aceSlot
                ? {
                      ...pokemon,
                      displayName: override.displayName,
                      primaryType: override.primaryType,
                      secondaryType: '',
                      baseStats: toEquivalentBaseStats(
                          override.actualStats,
                          pokemon.level,
                      ),
                      equivalentBaseStats: true,
                  }
                : pokemon,
        ),
    };
}

export function toEquivalentBaseStats(
    actualStats: PokemonBaseStats,
    level: number,
): PokemonBaseStats {
    if (!Number.isInteger(level) || level < 1 || level > 100) {
        throw new Error(
            'Equivalent stats require an integer level from 1 to 100.',
        );
    }

    const convert = (actual: number, offset: number): number => {
        const scaledStat = actual - offset;
        const base = Math.ceil((50 * (scaledStat + 1)) / level) - 1;
        if (
            !Number.isInteger(actual) ||
            base < 0 ||
            Math.floor((2 * base * level) / 100) + offset !== actual
        ) {
            throw new Error(
                `No matching equivalent base for stat ${actual} at level ${level}.`,
            );
        }
        return base;
    };

    return {
        hp: convert(actualStats.hp, level + 10),
        attack: convert(actualStats.attack, 5),
        defense: convert(actualStats.defense, 5),
        specialAttack: convert(actualStats.specialAttack, 5),
        specialDefense: convert(actualStats.specialDefense, 5),
        speed: convert(actualStats.speed, 5),
    };
}
