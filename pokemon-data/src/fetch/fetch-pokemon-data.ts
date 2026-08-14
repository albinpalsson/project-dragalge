import { cachedFetcher } from './cached-fetcher.ts';
import { buildWikitextUrl, parseBaseStats, parseTypes } from './bulbapedia-parser.ts';
import { POKEMON_CACHE } from './pokemon-cache.ts';

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
}

export async function fetchPokemonData(name: string): Promise<PokemonData> {

    const stats = POKEMON_CACHE[name];
    if (stats) {
        return {name, ...stats};
    }

    const json = await cachedFetcher.get(buildWikitextUrl(name));
    const parsed = JSON.parse(json) as { parse?: { wikitext: { '*': string } } };
    if (!parsed.parse) {
        throw new Error(`[${name}] Bulbapedia API error: ${json.slice(0, 200)}`);
    }

    const wikitext = parsed.parse.wikitext['*'];
    const baseStats = parseBaseStats(wikitext, name);

    if (!baseStats) {
        throw new Error(`[${name}] Failed to parse base stats from Bulbapedia wikitext`);
    }

    const types = parseTypes(wikitext);
    if (!types.primary_type) {
        throw new Error(`[${name}] Failed to parse types from Bulbapedia wikitext`);
    }

    return {name, ...baseStats, ...types};
}
