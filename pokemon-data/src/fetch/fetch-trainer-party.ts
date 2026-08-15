import { cachedFetcher } from './cached-fetcher.ts';
import { buildPageWikitextUrl } from './bulbapedia-parser.ts';
import { parseTrainerParty, parseTitanEntry } from './bulbapedia-trainer-parser.ts';
import type { TrainerPartyEntry } from './bulbapedia-trainer-parser.ts';
import type { BossFightSeed } from '../sources/fetch-boss-fight-seeds.ts';

export type { TrainerPartyEntry };

function parseWikitextResponse(json: string, pageName: string): string {
    const parsed = JSON.parse(json) as { parse?: { wikitext: { '*': string } } };
    if (!parsed.parse) {
        throw new Error(`[${pageName}] Bulbapedia API error: ${json.slice(0, 200)}`);
    }
    return parsed.parse.wikitext['*'];
}

export async function fetchTrainerParty(seed: BossFightSeed): Promise<TrainerPartyEntry[]> {
    const url = buildPageWikitextUrl(seed.bulbapediaPage);
    const json = await cachedFetcher.get(url);
    const wikitext = parseWikitextResponse(json, seed.bulbapediaPage);

    if (seed.type === 'titan') {
        return parseTitanEntry(wikitext, seed.battleSection, seed.name);
    }

    return parseTrainerParty(
        wikitext,
        seed.battleSection,
        seed.name,
        seed.starterVariant ?? undefined,
    );
}
