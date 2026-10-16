import { parseItemData, type ItemData } from './bulbapedia-item-parser.ts';
import { buildPageWikitextUrl } from './bulbapedia-parser.ts';
import { cachedFetcher } from './cached-fetcher.ts';

function parseWikitextResponse(
    json: string,
    itemName: string,
): { wikitext: string; missing: boolean } {
    const parsed = JSON.parse(json) as {
        parse?: { wikitext: { '*': string } };
        error?: { code: string };
    };
    if (parsed.error?.code === 'missingtitle') {
        return { wikitext: '', missing: true };
    }
    if (!parsed.parse) {
        throw new Error(
            `[${itemName}] Bulbapedia API error: ${json.slice(0, 200)}`,
        );
    }
    return { wikitext: parsed.parse.wikitext['*'], missing: false };
}

export async function fetchItemData(itemName: string): Promise<ItemData> {
    const { wikitext, missing } = parseWikitextResponse(
        await cachedFetcher.get(buildPageWikitextUrl(itemName)),
        itemName,
    );
    if (missing || !wikitext) {
        throw new Error(`[${itemName}] Item page not found on Bulbapedia`);
    }
    return parseItemData(wikitext, itemName);
}
