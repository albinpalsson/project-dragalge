import type { MoveData, ParsedMoveData } from './bulbapedia-move-parser.ts';
import { parseMoveData } from './bulbapedia-move-parser.ts';
import {
    buildMoveWikitextUrl,
    buildPageWikitextUrl,
} from './bulbapedia-parser.ts';
import { cachedFetcher } from './cached-fetcher.ts';
import { MOVE_DESCRIPTION_CACHE, MOVE_STAT_OVERRIDES } from './move-cache.ts';

export type { MoveData };

function parseWikitextResponse(
    json: string,
    pageName: string,
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
            `[${pageName}] Bulbapedia API error: ${json.slice(0, 200)}`,
        );
    }
    return { wikitext: parsed.parse.wikitext['*'], missing: false };
}

function applyStatOverrides(
    moveName: string,
    { ambiguous, ...data }: ParsedMoveData,
): MoveData {
    const override = MOVE_STAT_OVERRIDES[moveName];
    for (const stat of ['power', 'accuracy'] as const) {
        const value = override?.[stat];
        if (value !== undefined) {
            if (!ambiguous[stat]) {
                process.stderr.write(
                    `[${moveName}] MOVE_STAT_OVERRIDES ${stat} is no longer needed; the page value is not ambiguous\n`,
                );
            }
            data[stat] = value;
        } else if (ambiguous[stat]) {
            throw new Error(
                `[${moveName}] ${stat} is ambiguous (${ambiguous[stat]}); add an entry to MOVE_STAT_OVERRIDES`,
            );
        }
    }
    return data;
}

export async function fetchMoveData(moveName: string): Promise<MoveData> {
    const data = applyStatOverrides(
        moveName,
        await fetchParsedMoveData(moveName),
    );
    const cached = MOVE_DESCRIPTION_CACHE[moveName];
    if (cached) {
        return { ...data, effect: cached };
    }
    if (/^[-—–\s]*$/.test(data.effect)) {
        throw new Error(
            `[${moveName}] SV description is a placeholder; add an entry to MOVE_DESCRIPTION_CACHE`,
        );
    }
    return data;
}

async function fetchParsedMoveData(
    moveName: string,
): Promise<ParsedMoveData> {
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
    const { wikitext: plainWikitext, missing: plainMissing } =
        parseWikitextResponse(await cachedFetcher.get(plainUrl), moveName);
    if (plainMissing || !plainWikitext) {
        throw new Error(`[${moveName}] Move page not found on Bulbapedia`);
    }
    return parseMoveData(plainWikitext, moveName);
}
