export const DEFAULT_BAN_PRESET = [
    'Chansey',
    'Gyarados',
    'Annihilape',
    'Skeledirge',
    'Palafin',
] as const;
export const PSEUDO_LEGENDARY_PRESET = [
    'Baxcalibur',
    'Goodra',
    'Dragapult',
    'Tyranitar',
    'Salamence',
    'Garchomp',
    'Dragonite',
    'Hydreigon',
] as const;

export const BAN_REASON = {
    Settings: 'Banned by game settings',
    DupesClause: 'Dupes clause',
    MonoRun: 'Not allowed in mono run',
} as const;

export type BanReason = (typeof BAN_REASON)[keyof typeof BAN_REASON];

export type GetBanReason = (
    pokemonName: string,
    options?: { ignoreMonoRun?: boolean },
) => BanReason | undefined;

interface BuildSpeciesBansInput {
    manualBanNames: readonly string[];
    banFullEvolutionLines: boolean;
    dupesClauseEnabled: boolean;
    usedEncounterNames: readonly string[];
    getEvolutionFamily: (name: string) => readonly string[];
}

export function buildSpeciesBans(
    input: BuildSpeciesBansInput,
): ReadonlyMap<string, BanReason> {
    const speciesBans = new Map<string, BanReason>();

    if (input.dupesClauseEnabled) {
        for (const name of input.usedEncounterNames) {
            for (const familyName of input.getEvolutionFamily(name)) {
                speciesBans.set(
                    toSpeciesName(familyName),
                    BAN_REASON.DupesClause,
                );
            }
        }
    }

    for (const name of input.manualBanNames) {
        const names = input.banFullEvolutionLines
            ? input.getEvolutionFamily(name)
            : [name];
        for (const familyName of names) {
            speciesBans.set(toSpeciesName(familyName), BAN_REASON.Settings);
        }
    }

    return speciesBans;
}

/** "Oinkologne (Female)" -> "Oinkologne"; every form of a species shares bans and the dupes clause. */
export function toSpeciesName(pokemonName: string): string {
    return pokemonName.replace(/\s*\([^)]*\)$/, '');
}
