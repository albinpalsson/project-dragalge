import bossFightsData from './bossFights.json' with { type: 'json' };

export async function fetchBossFightSeeds() {
    return bossFightsData;
}
