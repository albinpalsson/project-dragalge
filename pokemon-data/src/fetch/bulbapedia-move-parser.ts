import {
    extractTemplate,
    extractTemplates,
    stripWikiMarkup,
} from './bulbapedia-parser.ts';

export interface MoveData {
    type: string;
    category: string;
    power: number;
    accuracy: number;
    effect: string;
}

// Raw infobox text of power/accuracy values whose current value is newer than
// Scarlet/Violet, so the parsed number can't be trusted.
export interface AmbiguousMoveStats {
    power?: string;
    accuracy?: string;
}

export interface ParsedMoveData extends MoveData {
    ambiguous: AmbiguousMoveStats;
}

function extractInfoboxParams(block: string): Record<string, string> {
    const params: Record<string, string> = {};
    // Use splitTopLevelParams to handle both |key=val and key=val| layout variants.
    const parts = splitTopLevelParams(block);
    for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        const eqIdx = part.indexOf('=');
        if (eqIdx === -1) {
            continue;
        }
        const key = part.slice(0, eqIdx).trim().toLowerCase();
        const value = part.slice(eqIdx + 1).trim();
        if (key) {
            params[key] = value;
        }
    }
    return params;
}

// Games released after Scarlet/Violet. A "prior to <game>" note on one of these
// means the infobox's current value comes from a game this project doesn't cover.
const POST_SV_GAME = /\bChampions\b|\bZ-A\b|\bGenerations?\s+(?:XII|XI|X)\b/i;

function isPostSvNote(note: string): boolean {
    return [...note.matchAll(/\b(?:prior to|before)\s+([^;,]+)/gi)].some(
        (match) => POST_SV_GAME.test(match[1]),
    );
}

function parsePowerOrAccuracy(raw: string): {
    value: number;
    ambiguous: boolean;
} {
    // {{tt|<current value>|<older generations' values>}}: keep the current value,
    // unless the note shows that value is newer than Scarlet/Violet
    const ambiguous = [
        ...raw.matchAll(/\{\{\s*tt\s*\|[^|}]*\|([^}]*)\}\}/gi),
    ].some((match) => isPostSvNote(match[1]));
    const cleaned = raw
        .replace(/\{\{\s*tt\s*\|([^|}]*)(?:\|[^}]*)?\}\}/gi, '$1')
        .trim();
    // "—" or "∞" or "-" all mean "no value" → 0
    if (!cleaned || /^[—–\-∞]/.test(cleaned)) {
        return { value: 0, ambiguous };
    }
    const n = parseInt(cleaned, 10);
    return { value: Number.isNaN(n) ? 0 : n, ambiguous };
}

// Splits the inner content of a template block on top-level | characters.
function splitTopLevelParams(block: string): string[] {
    const inner = block.slice(2, -2);
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < inner.length; i++) {
        if (
            (inner[i] === '{' || inner[i] === '[') &&
            inner[i + 1] === inner[i]
        ) {
            depth++;
            current += inner[i] + inner[i + 1];
            i++;
        } else if (
            (inner[i] === '}' || inner[i] === ']') &&
            inner[i + 1] === inner[i]
        ) {
            depth--;
            current += inner[i] + inner[i + 1];
            i++;
        } else if (inner[i] === '|' && depth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += inner[i];
        }
    }
    if (current) {
        parts.push(current);
    }
    return parts;
}

function extractSVDescription(wikitext: string, moveName: string): string {
    // Pattern 1: {{movedesc}} template with |SV= parameter (multiline-safe)
    const movedescBlock = extractTemplate(wikitext, 'movedesc');
    if (movedescBlock) {
        const match = /\|\s*SV\s*=\s*([\s\S]*?)(?=\n\s*\|[A-Za-z]|\}\})/i.exec(
            movedescBlock,
        );
        if (match) {
            const desc = stripWikiMarkup(match[1]).trim();
            if (desc) {
                return desc;
            }
        }
    }

    // Pattern 2: {{movedescentry}} templates — find the one whose game-labels part contains SV
    for (const entry of extractTemplates(wikitext, /\{\{\s*movedescentry/i)) {
        const parts = splitTopLevelParams(entry);
        // parts[0] = template name, parts[1] = game labels, parts[2] = description
        if (parts.length >= 3 && /\bSV\b/.test(parts[1])) {
            const desc = stripWikiMarkup(parts[2]).trim();
            if (desc) {
                return desc;
            }
        }
    }

    // Pattern 3: table row — cell with SV game tag followed by || description
    const svRowMatch =
        /\{\{(?:gameabbrev\d+|game)\|[^}]*\bSV\b[^}]*\}\}[^|\n]*\|\|([^\n|]+)/i.exec(
            wikitext,
        ) ?? /\|\s*\{\{SV\}\}[^|\n]*\|\|([^\n|]+)/i.exec(wikitext);
    if (svRowMatch) {
        const desc = stripWikiMarkup(svRowMatch[1]).trim();
        if (desc) {
            return desc;
        }
    }

    throw new Error(`[${moveName}] SV game description not found on move page`);
}

// Must match the width of moves.effect (CHAR is measured in UTF-8 bytes).
const MAX_EFFECT_BYTES = 164;

// Cuts on a code point boundary so multi-byte characters are never split.
function truncateToBytes(text: string, maxBytes: number): string {
    const encoder = new TextEncoder();
    let bytes = 0;
    let result = '';
    for (const char of text) {
        bytes += encoder.encode(char).length;
        if (bytes > maxBytes) {
            break;
        }
        result += char;
    }
    return result;
}

export function parseMoveData(
    wikitext: string,
    moveName: string,
): ParsedMoveData {
    const infobox = extractTemplate(wikitext, 'MoveInfobox');
    if (!infobox) {
        throw new Error(`[${moveName}] MoveInfobox template not found`);
    }

    const params = extractInfoboxParams(infobox);

    const type = stripWikiMarkup(params.type ?? '')
        .trim()
        .toLowerCase();
    if (!type) {
        throw new Error(`[${moveName}] Move type not found in MoveInfobox`);
    }

    const category = stripWikiMarkup(params.damagecategory ?? '')
        .trim()
        .toLowerCase();
    if (!category) {
        throw new Error(`[${moveName}] Move category not found in MoveInfobox`);
    }

    const power = parsePowerOrAccuracy(params.power ?? '');
    const accuracy = parsePowerOrAccuracy(params.accuracy ?? '');
    const ambiguous: AmbiguousMoveStats = {};
    if (power.ambiguous) {
        ambiguous.power = params.power;
    }
    if (accuracy.ambiguous) {
        ambiguous.accuracy = params.accuracy;
    }

    const effect = truncateToBytes(
        extractSVDescription(wikitext, moveName),
        MAX_EFFECT_BYTES,
    );

    return {
        type,
        category,
        power: power.value,
        accuracy: accuracy.value,
        effect,
        ambiguous,
    };
}
