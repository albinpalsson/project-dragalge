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

function parsePowerOrAccuracy(raw: string): number {
    // {{tt|<current value>|<older generations' values>}}: keep the current value
    const cleaned = raw
        .replace(/\{\{\s*tt\s*\|([^|}]*)(?:\|[^}]*)?\}\}/gi, '$1')
        .trim();
    // "—" or "∞" or "-" all mean "no value" → 0
    if (!cleaned || /^[—–\-∞]/.test(cleaned)) {
        return 0;
    }
    const n = parseInt(cleaned, 10);
    return Number.isNaN(n) ? 0 : n;
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

export function parseMoveData(wikitext: string, moveName: string): MoveData {
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

    const effect = extractSVDescription(wikitext, moveName).slice(0, 152);

    return { type, category, power, accuracy, effect };
}
