import { buildPageWikitextUrl } from '../fetch/bulbapedia-parser.ts';
import { parseTeraRaidPokemon } from '../fetch/bulbapedia-tera-raid-parser.ts';
import { cachedFetcher } from '../fetch/cached-fetcher.ts';
import { parseWikitextResponse } from '../fetch/fetch-trainer-party.ts';

export async function fetchTeraRaidSeeds(
    starLevels: readonly number[],
): Promise<string[]> {
    const names = new Set<string>();
    for (const level of starLevels) {
        if (!Number.isInteger(level) || level < 1 || level > 7) {
            throw new Error(`Invalid Tera Raid star level: ${level}`);
        }
        const pageName = `List of ${level}★ Tera Raid Battles (Paldea)`;
        const json = await cachedFetcher.get(buildPageWikitextUrl(pageName));
        const wikitext = parseWikitextResponse(json, pageName);
        for (const name of parseTeraRaidPokemon(wikitext, pageName)) {
            names.add(name);
        }
    }
    return [...names];
}
