export const GAMES_QUERY_KEY = ['games'];
export const GAME_CARDS_QUERY_KEY = ['game-cards'];
export const GAME_RUN_SNAPSHOTS_QUERY_KEY = ['game-run-snapshots'];
export const STARTERS_QUERY_KEY = ['starters'];
export const TYPE_CHART_QUERY_KEY = ['type-chart'];
export const EVOLUTION_GRAPH_QUERY_KEY = ['evolution-graph'];
export const POKEMON_TYPE_CATALOG_QUERY_KEY = ['pokemon-type-catalog'];

export const gameRunQueryKey = (gameRunName: string) => [
    'game-run',
    gameRunName,
];

export const encounterRollsQueryKey = (gameRunId: number) => [
    'encounter-rolls',
    gameRunId,
];
export const banListQueryKey = (gameRunId: number) => ['ban-list', gameRunId];

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

export const bossBattleRosterQueryKey = (battleName: string) => [
    'boss-battle-roster',
    battleName,
];

export const bossBattleProgressQueryKey = (gameRunId: number) => [
    'boss-battle-progress',
    gameRunId,
];
