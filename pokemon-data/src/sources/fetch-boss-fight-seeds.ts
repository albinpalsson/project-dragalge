import bossFightsData from './bossFights.json' with { type: 'json' };

export interface BossFightSeed {
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

export async function fetchBossFightSeeds(): Promise<BossFightSeed[]> {
    return bossFightsData;
}
