export const GAMES_QUERY_KEY = ['games'];
export const GAME_CARDS_QUERY_KEY = ['game-cards'];
export const STARTERS_QUERY_KEY = ['starters'];
export const TYPE_CHART_QUERY_KEY = ['type-chart'];

export const gameRunQueryKey = (gameRunName: string) => [
    'game-run',
    gameRunName,
];

export const encounterRollsQueryKey = (gameRunId: number) => [
    'encounter-rolls',
    gameRunId,
];

export const locationEncountersQueryKey = (locationName: string) => [
    'location-encounters',
    locationName,
];

export const pokemonQueryKey = (pokemonName: string) => [
    'pokemon',
    pokemonName,
];

export const pokemonEvolutionQueryKey = (pokemonName: string) => [
    'pokemon-evolution',
    pokemonName,
];

export const pokemonFirstStageQueryKey = (pokemonName: string) => [
    'pokemon-first-stage',
    pokemonName,
];

export const bossBattleRosterQueryKey = (battleName: string) => [
    'boss-battle-roster',
    battleName,
];

export const bossBattleProgressQueryKey = (gameRunId: number) => [
    'boss-battle-progress',
    gameRunId,
];
