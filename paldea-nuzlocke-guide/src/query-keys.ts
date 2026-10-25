export const GAMES_QUERY_KEY = ['games'];
export const GAME_CARDS_QUERY_KEY = ['game-cards'];
export const GAME_RUN_SNAPSHOTS_QUERY_KEY = ['game-run-snapshots'];
export const STARTERS_QUERY_KEY = ['starters'];
export const TYPE_CHART_QUERY_KEY = ['type-chart'];
export const EVOLUTION_GRAPH_QUERY_KEY = ['evolution-graph'];
export const POKEMON_TYPE_CATALOG_QUERY_KEY = ['pokemon-type-catalog'];

export const gameRunQueryKey = (gameName: string) => [
    'game-run',
    gameName,
];

export const encounterRollsQueryKey = (gameName: string) => [
    'encounter-rolls',
    gameName,
];
export const banListQueryKey = (gameName: string) => ['ban-list', gameName];

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

export const bossBattleProgressQueryKey = (gameName: string) => [
    'boss-battle-progress',
    gameName,
];
