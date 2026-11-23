import type { EvolutionGraph } from '../../db/pokemon-data/evolution-graph';
import type {
    BossBattleRoster,
    LocationEncounterView,
    PokemonTypeCatalog,
    PokemonTypeEntry,
    TypeChartEntry,
} from '../../db/pokemon-data/queries';
import type { STARTER_NAMES } from '../../utils/starter-choices';

export interface MonoPlanInputs {
    /** Lowercase, as stored in the type chart. */
    monoType: string;
    futureEvolutions: boolean;
    variant: 's' | 'v';
    dupesClause: boolean;
    includeTeamStar: boolean;
    /**
     * Starter used to pick Nemona's 2nd rival battle roster. 'auto' takes the
     * first mono-eligible starter, or the easiest one for the type when none
     * fits.
     */
    nemonaStarter: 'auto' | (typeof STARTER_NAMES)[number];
}

export interface MonoPlanData {
    /** Encounter rows by location name, as returned by the pokemon DB. */
    locationEncounters: ReadonlyMap<string, LocationEncounterView[]>;
    catalog: PokemonTypeCatalog;
    typeChart: readonly TypeChartEntry[];
    evolutionGraph: EvolutionGraph;
    /** Boss rosters by battle name. */
    bossRosters: ReadonlyMap<string, BossBattleRoster>;
    /** Base stat total by Pokémon name. */
    baseStatTotals: Readonly<Record<string, number>>;
}

export interface PoolSpecies {
    /** Species group key, e.g. "Deerling" for all its seasonal forms. */
    name: string;
    /** Actual Pokémon names behind the group. The first one gives the typing. */
    memberNames: string[];
    primaryType: string;
    secondaryType: string;
    /** Chance among the surviving species, using the normalized randomizer. */
    chance: number;
}

export interface RemovedSpecies {
    name: string;
    reason: string;
}

export interface StageTrace {
    label: string;
    speciesCount: number;
    /** Species left after this stage. */
    names: string[];
    /** Species that were in the previous stage and are gone now. */
    removed: RemovedSpecies[];
}

export type LocationOutcome = 'skipped' | 'guaranteed' | 'optional';

export interface LocationStep {
    kind: 'location';
    key: string;
    locationName: string;
    outcome: LocationOutcome;
    stages: StageTrace[];
    pool: PoolSpecies[];
    note?: string;
    /** Earlier guaranteed species that ban later ones (dupes clause only). */
    activeGuaranteedBans: string[];
}

export interface BossAttackTrace {
    moveName: string;
    moveType: string;
    power: number;
    /** 1, 1.5, or 2 for a Tera type that is also an original type. */
    stab: number;
    effectivePower: number;
    /** Whether it is strong enough to count as a threat. */
    relevant: boolean;
}

export interface BossMemberTrace {
    slot: number;
    pokemonName: string;
    level: number;
    primaryType: string;
    secondaryType: string;
    weight: number;
    teraType?: string;
    /** Typing it defends with: the Tera type alone for a Tera ace. */
    defenseTypes: string[];
    note?: string;
    attacks: BossAttackTrace[];
    /** Types of the relevant moves. */
    threatTypes: string[];
}

export interface BossMatchupTrace {
    member: string;
    holds: boolean;
    walls: boolean;
    /** Strongest relevant type against the candidate, empty without threats. */
    worstType: string;
    worstMultiplier: number;
    /** The candidate's own type that hits the boss Pokémon hardest. */
    bestHitType: string;
    bestHitMultiplier: number;
    /**
     * 0 when it does not hold; otherwise how the trade of hits goes: 0.5 when
     * it loses, 1 when even, 1.25 when it hits at least twice as hard.
     */
    score: number;
}

export interface CandidateForm {
    name: string;
    primaryType: string;
    secondaryType: string;
    /** Level needed to reach this form from the encountered one, 0 for none. */
    requiredLevel: number;
    /** Evolutions from the encountered form, 0 for the form itself. */
    stage: number;
}

export interface BossCandidate {
    name: string;
    iconName: string;
    guaranteed: boolean;
    /** Locations where it can show up. */
    locations: string[];
    /** The best form obtainable by the level cap, if any is mono-typed. */
    form?: CandidateForm;
    unusableReason?: string;
    /** Weighted average of the matchup scores over the boss team. */
    coverage: number;
    /** Weighted share of the boss team it resists every threat from. */
    wallCoverage: number;
    /** Base stat total of the fielded form, 0 when unknown. */
    baseStats: number;
    /** 1, 0.6 or 0.3 by base stats against the boss team's average. */
    baseStatFactor: number;
    /** min(1, 2 x coverage) x baseStatFactor. */
    answer: number;
    /** What it adds to the score; a guaranteed wall counts double. */
    value: number;
    matchups: BossMatchupTrace[];
}

export interface SlotExpectation {
    locationName: string;
    /** Number of species the slot can roll. */
    species: number;
    /** sum of chance x answer value over the pool. */
    expected: number;
    /** Answer value of the best species in the pool. */
    best: number;
}

export type DifficultyLevel = 'ok' | 'orange' | 'red';

export interface BossStep {
    kind: 'boss';
    key: string;
    label: string;
    battleName: string;
    teraType?: string;
    /** The Team Star boss's type, which its Starmobile has. */
    starType?: string;
    levelCap: number;
    /** Every Pokémon is assumed to have evolved as far as allowed. */
    fullyEvolved: boolean;
    totalWeight: number;
    /** Weighted average base stat total of the boss team, 0 when unknown. */
    teamBaseStats: number;
    required: number;
    orangeAt: number;
    members: BossMemberTrace[];
    /**
     * Pokémon you can have at this point (see `countCatches`): one per
     * location, and with the dupes clause one per evolution family.
     */
    locationsWalked: number;
    guaranteedSlots: number;
    optionalSlots: number;
    guaranteed: BossCandidate[];
    optional: BossCandidate[];
    /** What each optional slot is expected to add, in progression order. */
    slotExpectations: SlotExpectation[];
    /** Sum of the slot expectations. */
    optionalExpected: number;
    guaranteedSum: number;
    /** Expected optional value + guaranteed value; drives the level. */
    score: number;
    /**
     * Pokémon that count double (Tera ace, Starmobile, Titan) and that no
     * available candidate holds against. Any of them makes the fight Hard.
     */
    unanswered: string[];
    level: DifficultyLevel;
}

export type PlanStep = LocationStep | BossStep;

/** One Pokémon that may be on the team at a milestone. */
export interface MilestoneEntry {
    /** The species as encountered, to follow a catch across milestones. */
    speciesKey: string;
    /** The form it could be by the milestone's level cap. */
    formName: string;
    iconName: string;
    /** The run's one certain starter; it is always part of the team. */
    isStarter: boolean;
    /** Base stat total of the shown form, 0 (lowest in the game) to 1 (highest). */
    strength: number;
    /** Typing of the shown form; the secondary one is empty for single types. */
    primaryType: string;
    secondaryType: string;
    locations: string[];
}

export interface MilestoneSnapshot {
    id: string;
    label: string;
    key: string;
    /** The first gym had too little to show, so the second one is used. */
    usedFallback: boolean;
    /**
     * Pokémon in the box at this point: one catch per usable location, and
     * with the dupes clause at most one per evolution family (`countCatches`).
     */
    boxCount: number;
    /** Empty means nothing is available yet. */
    entries: MilestoneEntry[];
}

export interface MonoPlan {
    steps: PlanStep[];
    milestones: MilestoneSnapshot[];
    monoEligibleCount: number;
    summary: {
        /**
         * Catches by the end of the game: one per usable location, and with
         * the dupes clause at most one per evolution family (`countCatches`).
         */
        totalEncounters: number;
        bosses: number;
        ok: number;
        orange: number;
        red: number;
        skippedLocations: number;
        guaranteedLocations: number;
        optionalLocations: number;
    };
}

/** What limits the forms a Pokémon can be fielded as at one fight. */
export interface FightLimits {
    levelCap: number;
    /** Progression position of the boss. */
    bossIndex: number;
    /**
     * Ignore the level cap and drop unevolved forms that have an allowed
     * evolution. Used from the Elite Four on.
     */
    fullyEvolved?: boolean;
}

/** One location that gives an encounter, as seen by later bosses. */
export interface Slot {
    locationName: string;
    kind: 'guaranteed' | 'optional';
    pool: PoolSpecies[];
}

/** Fixed for one plan. */
export interface PlanContext {
    inputs: MonoPlanInputs;
    data: MonoPlanData;
    typesByName: ReadonlyMap<string, PokemonTypeEntry>;
    monoEligible: ReadonlySet<string>;
    multiplierCache: Map<string, number>;
    nemonaStarter: (typeof STARTER_NAMES)[number];
    /** Lowest and highest base stat total in the catalog. */
    baseStatRange: { min: number; max: number };
}

/** Grows while the plan walks the progression. */
export interface PlanState {
    slots: Slot[];
    /** Pokémon names fed to the dupes clause as if they had been caught. */
    guaranteedPokemonNames: string[];
    guaranteedSpecies: string[];
}
