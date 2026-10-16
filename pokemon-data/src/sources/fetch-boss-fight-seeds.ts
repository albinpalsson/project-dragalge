import bossFightsData from './bossFights.json' with { type: 'json' };
import trainersData from './trainers.json' with { type: 'json' };
import type { TrainerPartyEntry } from '../fetch/fetch-trainer-party.ts';

export interface BulbapediaBossFightSeed {
    id: string;
    name: string;
    type: string;
    levelCap: number;
    order: number;
    location: string;
    bulbapediaPage: string;
    battleSection: string;
    starterVariant: string | null;
}

export interface LocalTrainerBossSeed {
    source: 'local-trainer';
    name: string;
    type: 'strong';
    party: TrainerPartyEntry[];
}

export type BossFightSeed =
    | (BulbapediaBossFightSeed & { source: 'bulbapedia' })
    | LocalTrainerBossSeed;

interface TrainerPokemonSeed {
    name: string;
    level: number;
    item?: string;
    ability1: string;
    ability2?: string;
    moves: { name: string }[];
}

interface TrainerSeedData {
    name: string;
    roster: TrainerPokemonSeed[];
}

function loadLocalTrainerSeeds(): LocalTrainerBossSeed[] {
    const trainers = trainersData as TrainerSeedData[];
    const names = new Set<string>();

    return trainers.map((trainer) => {
        const normalizedName = trainer.name.trim().toLowerCase();
        names.add(normalizedName);

        const party = trainer.roster.map((pokemon): TrainerPartyEntry => {
            const ability2 = pokemon.ability2?.trim() ?? '';
            const item = pokemon.item?.trim() ?? '';
            return {
                pokemon: pokemon.name.trim(),
                level: pokemon.level,
                ability: pokemon.ability1.trim(),
                ...(ability2 ? { ability2 } : {}),
                ...(item ? { item } : {}),
                moves: pokemon.moves.map((move) => move.name.trim()),
            };
        });

        return {
            source: 'local-trainer',
            name: trainer.name.trim(),
            type: 'strong',
            party,
        };
    });
}

export async function fetchBossFightSeeds(): Promise<BossFightSeed[]> {
    return [
        ...bossFightsData.map((seed) => ({
            ...seed,
            source: 'bulbapedia' as const,
        })),
        ...loadLocalTrainerSeeds(),
    ];
}
