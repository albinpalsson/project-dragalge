import { cachedFetcher } from './cached-fetcher.ts';
import { buildMoveWikitextUrl, buildPageWikitextUrl } from './bulbapedia-parser.ts';
import { parseMoveData } from './bulbapedia-move-parser.ts';
import type { MoveData } from './bulbapedia-move-parser.ts';

export type { MoveData };

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

export async function fetchMoveData(moveName: string): Promise<MoveData> {
    // Try the standard "(move)" disambig page first
    const moveUrl = buildMoveWikitextUrl(moveName);
    const { wikitext, missing } = parseWikitextResponse(
        await cachedFetcher.get(moveUrl),
        `${moveName} (move)`,
    );

    if (!missing && wikitext) {
        return parseMoveData(wikitext, moveName);
    }

    // Fallback: plain page name (for moves that don't need disambiguation)
    const plainUrl = buildPageWikitextUrl(moveName);
    const { wikitext: plainWikitext, missing: plainMissing } = parseWikitextResponse(
        await cachedFetcher.get(plainUrl),
        moveName,
    );
    if (plainMissing || !plainWikitext) {
        throw new Error(`[${moveName}] Move page not found on Bulbapedia`);
    }
    return parseMoveData(plainWikitext, moveName);
}
