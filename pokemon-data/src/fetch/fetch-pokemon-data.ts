import {
    buildWikitextUrl,
    type EvolutionEdge,
    parseBaseStats,
    parseEvolutionEdges,
    parseTypes,
} from './bulbapedia-parser.ts';
import { cachedFetcher } from './cached-fetcher.ts';
import { POKEMON_CACHE, POKEMON_EVOLUTION_OVERRIDES } from './pokemon-cache.ts';

export interface PokemonData {
    name: string;
    primary_type: string;
    secondary_type: string;
    base_hp: number;
    base_attack: number;
    base_defense: number;
    base_sp_attack: number;
    base_sp_defense: number;
    base_speed: number;
    evolution_edges: EvolutionEdge[];
}

export async function fetchPokemonData(name: string): Promise<PokemonData> {
    const json = await cachedFetcher.get(buildWikitextUrl(name));
    const parsed = JSON.parse(json) as {
        parse?: { wikitext: { '*': string } };
    };
    if (!parsed.parse) {
        throw new Error(
            `[${name}] Bulbapedia API error: ${json.slice(0, 200)}`,
        );
    }

    const wikitext = parsed.parse.wikitext['*'];
    const cached = POKEMON_CACHE[name];
    const baseStats = cached ?? parseBaseStats(wikitext, name);

    if (!baseStats) {
        throw new Error(
            `[${name}] Failed to parse base stats from Bulbapedia wikitext`,
        );
    }

    const types = cached ?? parseTypes(wikitext, name);
    if (!types.primary_type) {
        throw new Error(
            `[${name}] Failed to parse types from Bulbapedia wikitext`,
        );
    }

    return {
        name,
        ...baseStats,
        ...types,
        evolution_edges:
            POKEMON_EVOLUTION_OVERRIDES[name] ??
            parseEvolutionEdges(wikitext, name),
    };
}
