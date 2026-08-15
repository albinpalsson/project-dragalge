import { ABILITY_DESCRIPTION_CACHE } from './ability-cache.ts';
import { cachedFetcher } from './cached-fetcher.ts';
import { buildAbilityWikitextUrl, buildPageWikitextUrl } from './bulbapedia-parser.ts';
import { parseAbilityData } from './bulbapedia-ability-parser.ts';
import type { AbilityData } from './bulbapedia-ability-parser.ts';

export type { AbilityData };

function parseWikitextResponse(
    json: string,
    pageName: string,
): { wikitext: string; missing: boolean } {
    const parsed = JSON.parse(json) as {
        parse?: { wikitext: { '*': string } };
        error?: { code: string };
    };
    if (parsed.error?.code === 'missingtitle') return { wikitext: '', missing: true };
    if (!parsed.parse) {
        throw new Error(`[${pageName}] Bulbapedia API error: ${json.slice(0, 200)}`);
    }
    return { wikitext: parsed.parse.wikitext['*'], missing: false };
}

function getCachedAbilityDescription(name: string): string | undefined {
    return ABILITY_DESCRIPTION_CACHE[name] ?? ABILITY_DESCRIPTION_CACHE[name.trim()];
}

export async function fetchAbilityData(abilityName: string): Promise<AbilityData> {
    const pageWithDisambiguation = `${abilityName} (Ability)`;
    const disambiguatedUrl = buildAbilityWikitextUrl(abilityName);
    const { wikitext, missing } = parseWikitextResponse(
        await cachedFetcher.get(disambiguatedUrl),
        pageWithDisambiguation,
    );

    let pageWikitext = wikitext;
    if (missing || !pageWikitext) {
        const plainUrl = buildPageWikitextUrl(abilityName);
        const plain = parseWikitextResponse(await cachedFetcher.get(plainUrl), abilityName);
        if (plain.missing || !plain.wikitext) {
            const cached = getCachedAbilityDescription(abilityName);
            if (cached) {
                return { description: cached };
            }
            throw new Error(`[${abilityName}] Ability page not found on Bulbapedia`);
        }
        pageWikitext = plain.wikitext;
    }

    try {
        return parseAbilityData(pageWikitext, abilityName);
    } catch (error) {
        const cached = getCachedAbilityDescription(abilityName);
        if (cached) {
            process.stderr.write(`[${abilityName}] Ability parse failed, using local cache fallback\n`);
            return { description: cached };
        }
        throw error;
    }
}
