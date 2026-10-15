import { extractTemplates, stripWikiMarkup } from './bulbapedia-parser.ts';

// Maps each starter line to the set of Pokémon names in that evolutionary line.
const STARTER_LINES: Record<string, ReadonlySet<string>> = {
    sprigatito: new Set(['Sprigatito', 'Floragato', 'Meowscarada']),
    fuecoco: new Set(['Fuecoco', 'Crocalor', 'Skeledirge']),
    quaxly: new Set(['Quaxly', 'Quaxwell', 'Quaquaval']),
};

// When the player chose starter X, Nemona uses the Pokémon from this line.
const PLAYER_TO_NEMONA_LINE: Record<string, string> = {
    sprigatito: 'quaxly',
    fuecoco: 'sprigatito',
    quaxly: 'fuecoco',
};

export interface TrainerPartyEntry {
    pokemon: string;
    level: number;
    ability: string;
    moves: string[];
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Splits a template block on top-level | characters, respecting nested {{ }} and [[ ]].
function splitTemplateParams(block: string): string[] {
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
    if (current.trim()) {
        parts.push(current);
    }
    return parts;
}

function parseRobustTemplateParams(block: string): Record<string, string> {
    const parts = splitTemplateParams(block);
    const params: Record<string, string> = {};
    for (const part of parts) {
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

// Extracts text from after the given heading to the next heading at the same or higher level.
function extractSection(wikitext: string, heading: string): string | null {
    for (let level = 2; level <= 5; level++) {
        const eq = '='.repeat(level);
        const re = new RegExp(
            `^${eq}\\s*${escapeRegex(heading)}\\s*${eq}[ \\t]*$`,
            'im',
        );
        const match = re.exec(wikitext);
        if (!match) {
            continue;
        }
        const afterHeading = match.index + match[0].length;
        const nextRe = new RegExp(`^={2,${level}}[^=]`, 'm');
        const nextMatch = nextRe.exec(wikitext.slice(afterHeading));
        const end = nextMatch
            ? afterHeading + nextMatch.index
            : wikitext.length;
        return wikitext.slice(afterHeading, end);
    }
    return null;
}

function parsePokemonBlock(block: string): TrainerPartyEntry | null {
    const params = parseRobustTemplateParams(block);
    const pokemon = stripWikiMarkup(params.pokemon ?? '').trim();
    const level = parseInt(params.level ?? '', 10);
    const ability = stripWikiMarkup(params.ability ?? '').trim();

    if (!pokemon || Number.isNaN(level)) {
        return null;
    }

    const moves: string[] = [];
    for (let i = 1; i <= 4; i++) {
        const move = stripWikiMarkup(params[`move${i}`] ?? '')
            .replace(/&nbsp;/g, ' ')
            .trim();
        if (move) {
            moves.push(move);
        }
    }

    return { pokemon, level, ability, moves };
}

function findPokemonTemplatesInText(text: string): string[] {
    return extractTemplates(
        text,
        /\{\{\s*Pokémon(?:\/[A-Za-z0-9]*)?(?:\s|\|)/i,
    );
}

function findPartyBlocks(text: string): string[] {
    return extractTemplates(text, /\{\{\s*Party(?:\s|\|)/i);
}

function extractPokemonEntries(
    sectionText: string,
    context: string,
): TrainerPartyEntry[] {
    const entries: TrainerPartyEntry[] = [];

    // Prefer Pokémon inside a {{Party}} wrapper
    const partyBlocks = findPartyBlocks(sectionText);
    if (partyBlocks.length > 0) {
        for (const partyBlock of partyBlocks) {
            for (const block of findPokemonTemplatesInText(partyBlock)) {
                const entry = parsePokemonBlock(block);
                if (entry) {
                    entries.push(entry);
                }
            }
        }
        if (entries.length > 0) {
            return entries;
        }
    }

    // Fallback: standalone {{Pokémon}} templates anywhere in the section
    for (const block of findPokemonTemplatesInText(sectionText)) {
        const entry = parsePokemonBlock(block);
        if (entry) {
            entries.push(entry);
        }
    }

    if (entries.length === 0) {
        throw new Error(`[${context}] No Pokémon entries found in section`);
    }
    return entries;
}

export function parseTrainerParty(
    wikitext: string,
    sectionHeading: string,
    trainerName: string,
    starterVariant?: string,
): TrainerPartyEntry[] {
    const section = extractSection(wikitext, sectionHeading);
    if (!section) {
        throw new Error(
            `[${trainerName}] Section "${sectionHeading}" not found on page`,
        );
    }

    if (starterVariant) {
        const nemonaLine = PLAYER_TO_NEMONA_LINE[starterVariant.toLowerCase()];
        if (!nemonaLine) {
            throw new Error(
                `[${trainerName}] Unknown starter variant: "${starterVariant}"`,
            );
        }
        const nemonaNames = STARTER_LINES[nemonaLine];
        // Party structure: {{Party...}} header, then standalone {{Pokémon...}} templates, then {{Party/end}}.
        // Split on {{Party/end}} to isolate each variant's segment.
        const segments = section.split(/\{\{\s*Party\/end\s*\}\}/gi);
        for (const segment of segments) {
            const entries: TrainerPartyEntry[] = [];
            for (const block of findPokemonTemplatesInText(segment)) {
                const entry = parsePokemonBlock(block);
                if (entry) {
                    entries.push(entry);
                }
            }
            if (
                entries.length > 0 &&
                entries.some((e) => nemonaNames.has(e.pokemon))
            ) {
                return entries;
            }
        }
        throw new Error(
            `[${trainerName}] No Party group found containing the ${nemonaLine} line in section "${sectionHeading}"`,
        );
    }

    return extractPokemonEntries(section, trainerName);
}

export function parseTitanEntry(
    wikitext: string,
    sectionHeading: string,
    titanName: string,
): TrainerPartyEntry[] {
    const section = extractSection(wikitext, sectionHeading);
    if (!section) {
        throw new Error(
            `[Titan Pokémon] Section "${sectionHeading}" not found (titan: ${titanName})`,
        );
    }
    // Partner Pokémon follow a {{Party...}} block; only take Pokémon before it.
    const partnerStart = section.search(/\{\{\s*Party(?:\s|\|)/i);
    const titanSection =
        partnerStart !== -1 ? section.slice(0, partnerStart) : section;
    return extractPokemonEntries(titanSection, `Titan: ${titanName}`);
}
