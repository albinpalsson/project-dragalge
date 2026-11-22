import { getNemonaBattleName } from '../../db/pokemon-data/starter-battles';
import { STARTER_NAMES } from '../../utils/starter-choices';
import type { DifficultyLevel } from './plan-types';

/**
 * The boss fights the planner scores, keyed by progression item key (see
 * `PROGRESSION_ITEMS`). The rosters and moves come from the pokemon DB; only
 * what the DB lacks lives here, mirroring the boss components in
 * `views/Game/progression/bosses/*` (`BATTLE_NAME` and the `teraType` prop).
 *
 * Bosses missing from this map are not part of the planner: Arven, strong
 * trainers, Geeta and every Nemona battle except the 2nd rival battle (the
 * first one after the tutorial).
 */
export interface BossConfig {
    label: string;
    /** Fixed battle name. Nemona's 2nd rival battle depends on the starter. */
    battleName?: string;
    nemonaSecondBattle?: boolean;
    group: 'main' | 'teamStar';
    /** Every Pokémon in a Titan fight counts double. */
    titan?: boolean;
    /**
     * Lowercase. Only the ace (the last slot) Terastallizes, and it counts
     * double.
     */
    teraType?: string;
    /**
     * Lowercase. A Team Star boss's type, which its Starmobile ace has
     * instead of Revavroom's own typing.
     */
    starType?: string;
    /**
     * Assume every Pokémon has had the chance to evolve by this fight: the level
     * cap is ignored and unevolved forms are not counted when a further
     * evolution is allowed in the run.
     */
    fullyEvolved?: boolean;
    /** Great Tusk and Iron Treads share a roster; keep the version's one. */
    versionPokemon?: { s: string; v: string };
    /**
     * The hardest this fight is ever rated, for fights that are easier than
     * their team suggests (weak AI, a helpful partner).
     */
    maxLevel?: DifficultyLevel;
}

/**
 * The player starter that makes Nemona's 2nd rival battle easiest.
 * Types that hit none of them harder than neutral default to
 * Fuecoco -> Nemona gets Sprigatito.
 */
export const EASIEST_STARTER_BY_MONO_TYPE: Readonly<
    Partial<Record<string, (typeof STARTER_NAMES)[number]>>
> = {
    bug: 'Fuecoco',
    electric: 'Sprigatito',
    flying: 'Fuecoco',
    ground: 'Quaxly',
    ice: 'Fuecoco',
    poison: 'Fuecoco',
    rock: 'Quaxly',
    steel: 'Fuecoco',
    dragon: 'Fuecoco',
    fairy: 'Fuecoco',
    normal: 'Fuecoco',
    psychic: 'Fuecoco',
};

export const BOSS_CONFIGS: Readonly<Record<string, BossConfig>> = {
    'nemona-south-province': {
        label: 'Nemona (2nd rival battle)',
        nemonaSecondBattle: true,
        group: 'main',
        teraType: 'electric',
    },
    'katy-bug-gym': {
        label: 'Katy (Bug Gym)',
        battleName: 'Katy (Bug Gym)',
        group: 'main',
        teraType: 'bug',
    },
    'klawf-stony-cliff-titan': {
        label: 'Klawf (Stony Cliff Titan)',
        battleName: 'Klawf (Stony Cliff Titan)',
        group: 'main',
        titan: true,
        maxLevel: 'orange',
    },
    'brassius-grass-gym': {
        label: 'Brassius (Grass Gym)',
        battleName: 'Brassius (Grass Gym)',
        group: 'main',
        teraType: 'grass',
    },
    'bombirdier-open-sky-titan': {
        label: 'Bombirdier (Open Sky Titan)',
        battleName: 'Bombirdier (Open Sky Titan)',
        group: 'main',
        titan: true,
    },
    'giacomo-dark-star': {
        label: 'Giacomo (Dark Star)',
        battleName: 'Giacomo (Dark Star)',
        group: 'teamStar',
        starType: 'dark',
    },
    'iono-electric-gym': {
        label: 'Iono (Electric Gym)',
        battleName: 'Iono (Electric Gym)',
        group: 'main',
        teraType: 'electric',
    },
    'mela-fire-star': {
        label: 'Mela (Fire Star)',
        battleName: 'Mela (Fire Star)',
        group: 'teamStar',
        starType: 'fire',
    },
    'orthworm-lurking-steel-titan': {
        label: 'Orthworm (Lurking Steel Titan)',
        battleName: 'Orthworm (Lurking Steel Titan)',
        group: 'main',
        titan: true,
    },
    'kofu-water-gym': {
        label: 'Kofu (Water Gym)',
        battleName: 'Kofu (Water Gym)',
        group: 'main',
        teraType: 'water',
    },
    'atticus-poison-star': {
        label: 'Atticus (Poison Star)',
        battleName: 'Atticus (Poison Star)',
        group: 'teamStar',
        starType: 'poison',
    },
    'larry-normal-gym': {
        label: 'Larry (Normal Gym)',
        battleName: 'Larry (Normal Gym)',
        group: 'main',
        teraType: 'normal',
    },
    'ryme-ghost-gym': {
        label: 'Ryme (Ghost Gym)',
        battleName: 'Ryme (Ghost Gym)',
        group: 'main',
        teraType: 'ghost',
    },
    'great-tusk-quaking-earth-titan': {
        label: 'Great Tusk/Iron Treads (Quaking Earth Titan)',
        battleName: 'Great Tusk/Iron Treads (Quaking Earth Titan)',
        group: 'main',
        titan: true,
        versionPokemon: { s: 'Great Tusk', v: 'Iron Treads' },
    },
    'tulip-psychic-gym': {
        label: 'Tulip (Psychic Gym)',
        battleName: 'Tulip (Psychic Gym)',
        group: 'main',
        teraType: 'psychic',
    },
    'grusha-ice-gym': {
        label: 'Grusha (Ice Gym)',
        battleName: 'Grusha (Ice Gym)',
        group: 'main',
        teraType: 'ice',
    },
    'ortega-fairy-star': {
        label: 'Ortega (Fairy Star)',
        battleName: 'Ortega (Fairy Star)',
        group: 'teamStar',
        starType: 'fairy',
    },
    'eri-fighting-star': {
        label: 'Eri (Fighting Star)',
        battleName: 'Eri (Fighting Star)',
        group: 'teamStar',
        starType: 'fighting',
    },
    'dondozo-false-dragon-titan': {
        label: 'Dondozo (False Dragon Titan)',
        battleName: 'Dondozo (False Dragon Titan)',
        group: 'main',
        titan: true,
    },
    'rika-elite-four': {
        label: 'Rika (Elite Four)',
        battleName: 'Rika (Elite Four)',
        group: 'main',
        teraType: 'ground',
        fullyEvolved: true,
    },
    'poppy-elite-four': {
        label: 'Poppy (Elite Four)',
        battleName: 'Poppy (Elite Four)',
        group: 'main',
        teraType: 'steel',
        fullyEvolved: true,
    },
    'larry-elite-four': {
        label: 'Larry (Elite Four)',
        battleName: 'Larry (Elite Four)',
        group: 'main',
        teraType: 'flying',
        fullyEvolved: true,
    },
    'hassel-elite-four': {
        label: 'Hassel (Elite Four)',
        battleName: 'Hassel (Elite Four)',
        group: 'main',
        teraType: 'dragon',
        fullyEvolved: true,
    },
};

/** Every battle the planner may need a roster for. */
export const BOSS_BATTLE_NAMES: readonly string[] = [
    ...new Set([
        ...Object.values(BOSS_CONFIGS).flatMap((config) =>
            config.battleName ? [config.battleName] : [],
        ),
        ...STARTER_NAMES.map((starter) =>
            getNemonaBattleName(starter, 'Second'),
        ),
    ]),
];
