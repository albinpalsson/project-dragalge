import { extractTemplates, stripWikiMarkup } from './bulbapedia-parser.ts';

export interface ItemData {
    description: string;
}

function splitTopLevelParams(block: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 2;

    for (let index = 2; index < block.length - 2; index += 1) {
        const pair = block.slice(index, index + 2);
        if (pair === '{{' || pair === '[[') {
            depth += 1;
            index += 1;
        } else if (pair === '}}' || pair === ']]') {
            depth -= 1;
            index += 1;
        } else if (block[index] === '|' && depth === 0) {
            parts.push(block.slice(start, index).trim());
            start = index + 1;
        }
    }

    parts.push(block.slice(start, -2).trim());
    return parts;
}

function normalizeDescription(value: string): string {
    return stripWikiMarkup(value)
        .replace(/''+/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function parseItemData(wikitext: string, itemName: string): ItemData {
    const entries = extractTemplates(wikitext, /\{\{\s*movedescentry\s*\|/i);
    const scarletVioletEntries = entries.flatMap((entry) => {
        const parameters = splitTopLevelParams(entry);
        const gameParameter = parameters[1] ?? '';
        if (
            !/gameabbrev9\s*\|\s*SV(?:ZA)?(?:\s*\}\}|\s*\|)/i.test(
                gameParameter,
            )
        ) {
            return [];
        }
        const description = normalizeDescription(parameters.at(-1) ?? '');
        return description ? [{ description, gameParameter }] : [];
    });
    const description =
        scarletVioletEntries.find(
            (entry) => !/gameabbrev9\s*\|\s*ZA/i.test(entry.gameParameter),
        )?.description ?? scarletVioletEntries[0]?.description;

    if (!description) {
        throw new Error(
            `[${itemName}] Scarlet and Violet item description not found`,
        );
    }

    return { description };
}
