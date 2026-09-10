export const GAMES_QUERY_KEY = ['games'];
export const GAME_CARDS_QUERY_KEY = ['game-cards'];
export const STARTERS_QUERY_KEY = ['starters'];
export const TYPE_CHART_QUERY_KEY = ['type-chart'];

export const gameRunQueryKey = (gameRunId: string) => ['game-run', gameRunId];

export const encounterRollsQueryKey = (gameRunId: string) => [
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
