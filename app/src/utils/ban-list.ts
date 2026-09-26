import { getRandomizerGroupKey } from '../randomizer-groups';

export const DEFAULT_BAN_PRESET = [
    'Chansey',
    'Gyarados',
    'Annihilape',
    'Fuecoco',
    'Palafin'
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
} as const;

export type BanReason = (typeof BAN_REASON)[keyof typeof BAN_REASON];
export type BanReasonMap = ReadonlyMap<string, BanReason>;

interface BuildBanReasonMapInput {
    manualBanNames: readonly string[];
    banFullEvolutionLines: boolean;
    dupesClauseEnabled: boolean;
    usedEncounterNames: readonly string[];
    getEvolutionFamily: (name: string) => readonly string[];
}

export function buildBanReasonMap(
    input: BuildBanReasonMapInput,
): BanReasonMap {
    const result = new Map<string, BanReason>();

    if (input.dupesClauseEnabled) {
        for (const name of input.usedEncounterNames) {
            for (const familyName of input.getEvolutionFamily(name)) {
                result.set(
                    getRandomizerGroupKey(familyName),
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
            result.set(
                getRandomizerGroupKey(familyName),
                BAN_REASON.Settings,
            );
        }
    }

    return result;
}

export function getBanReason(
    banReasons: BanReasonMap,
    pokemonName: string,
): string | undefined {
    return banReasons.get(getRandomizerGroupKey(pokemonName));
}