import { extractTemplates, stripWikiMarkup } from './bulbapedia-parser.ts';

export interface AbilityData {
    description: string;
}

interface Heading {
    level: number;
    title: string;
    start: number;
    end: number;
}

function collectHeadings(wikitext: string): Heading[] {
    const headings: Heading[] = [];
    const regex = /^(={2,5})\s*([^=\n]+?)\s*\1\s*$/gm;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(wikitext)) !== null) {
        const start = match.index;
        const lineEnd = wikitext.indexOf('\n', start);
        headings.push({
            level: match[1].length,
            title: match[2].trim(),
            start,
            end: lineEnd === -1 ? wikitext.length : lineEnd + 1,
        });
    }
    return headings;
}

function normalizeHeadingTitle(title: string): string {
    return title.replace(/\s+/g, ' ').trim().toLowerCase();
}

function extractSection(
    wikitext: string,
    headings: readonly Heading[],
    level: number,
    title: string,
    bounds?: { start: number; end: number },
): { content: string; start: number; end: number } | null {
    const normalizedTitle = normalizeHeadingTitle(title);
    const targetIndex = headings.findIndex((heading) => {
        if (heading.level !== level) {
            return false;
        }
        if (normalizeHeadingTitle(heading.title) !== normalizedTitle) {
            return false;
        }
        if (!bounds) {
            return true;
        }
        return heading.start >= bounds.start && heading.start < bounds.end;
    });

    if (targetIndex === -1) {
        return null;
    }

    const target = headings[targetIndex];
    let contentEnd = bounds?.end ?? wikitext.length;
    for (let i = targetIndex + 1; i < headings.length; i++) {
        const next = headings[i];
        if (bounds && next.start >= bounds.end) {
            break;
        }
        if (next.level <= target.level) {
            contentEnd = next.start;
            break;
        }
    }

    return {
        content: wikitext.slice(target.end, contentEnd),
        start: target.end,
        end: contentEnd,
    };
}

function normalizeAbilityDescription(value: string): string {
    let text = stripWikiMarkup(value);
    text = text.replace(/\{\{\s*sup\|[^}]*\}\}/gi, '');
    text = text.replace(/\{\{\s*tt\|([^|}]+)\|[^}]*\}\}/gi, '$1');
    text = text.replace(/''+/g, '');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function splitTopLevelParams(block: string): string[] {
    const inner = block.slice(2, -2);
    const parts: string[] = [];
    let depth = 0;
    let current = '';
    for (let i = 0; i < inner.length; i++) {
        if ((inner[i] === '{' || inner[i] === '[') && inner[i + 1] === inner[i]) {
            depth++;
            current += inner[i] + inner[i + 1];
            i++;
            continue;
        }
        if ((inner[i] === '}' || inner[i] === ']') && inner[i + 1] === inner[i]) {
            depth--;
            current += inner[i] + inner[i + 1];
            i++;
            continue;
        }
        if (inner[i] === '|' && depth === 0) {
            parts.push(current);
            current = '';
            continue;
        }
        current += inner[i];
    }
    if (current) {
        parts.push(current);
    }
    return parts;
}

function scoreGenerationTag(rawTag: string): number {
    const tag = rawTag.trim().toUpperCase();
    if (tag === 'SV' || tag === 'IX') {
        return 900;
    }
    const roman = /^(I|II|III|IV|V|VI|VII|VIII|IX|X)$/.exec(tag);
    if (roman) {
        return romanToInt(roman[1]) * 10;
    }
    const arabic = /^(\d{1,2})$/.exec(tag);
    if (arabic) {
        return parseInt(arabic[1], 10) * 10;
    }
    return 0;
}

function extractInfoboxDescription(wikitext: string): string | null {
    const templates = extractTemplates(wikitext, /\{\{\s*AbilityInfobox\/desc/i);
    if (templates.length === 0) {
        return null;
    }

    let bestDescription = '';
    let bestScore = -1;
    for (const template of templates) {
        const parts = splitTopLevelParams(template);
        if (parts.length < 3) {
            continue;
        }
        const generationTag = parts[1]?.trim() ?? '';
        const rawDescription = parts[2]?.trim() ?? '';
        const description = normalizeAbilityDescription(rawDescription);
        if (!description) {
            continue;
        }
        const score = scoreGenerationTag(generationTag);
        if (score > bestScore) {
            bestScore = score;
            bestDescription = description;
        }
    }

    return bestDescription || null;
}

function romanToInt(value: string): number {
    const chars = value.toUpperCase().trim();
    const map: Record<string, number> = { I: 1, V: 5, X: 10 };
    let total = 0;
    let prev = 0;
    for (let i = chars.length - 1; i >= 0; i--) {
        const cur = map[chars[i]] ?? 0;
        if (cur < prev) {
            total -= cur;
        } else {
            total += cur;
            prev = cur;
        }
    }
    return total;
}

interface GenerationSubsection {
    title: string;
    content: string;
}

function collectGenerationSubsections(inBattleContent: string): GenerationSubsection[] {
    const rows: GenerationSubsection[] = [];
    const headingRegex = /^====\s*([^=\n]+?)\s*====\s*$/gm;
    let match: RegExpExecArray | null;
    const headings: { title: string; start: number; end: number }[] = [];
    while ((match = headingRegex.exec(inBattleContent)) !== null) {
        const start = match.index;
        const lineEnd = inBattleContent.indexOf('\n', start);
        headings.push({
            title: match[1].trim(),
            start,
            end: lineEnd === -1 ? inBattleContent.length : lineEnd + 1,
        });
    }

    if (headings.length === 0) {
        return rows;
    }

    for (let i = 0; i < headings.length; i++) {
        const cur = headings[i];
        const next = headings[i + 1];
        rows.push({
            title: cur.title,
            content: inBattleContent.slice(cur.end, next?.start ?? inBattleContent.length),
        });
    }
    return rows;
}

function scoreGenerationSubsection(title: string): number {
    const normalized = normalizeHeadingTitle(title);
    const generationMatch = /generation(?:s)?\s+([ivx]+)/i.exec(title);
    const generation = generationMatch ? romanToInt(generationMatch[1]) : 0;
    if (normalized.includes('generation ix')) {
        return 10_000 + generation;
    }
    if (normalized.includes('onward')) {
        return 1_000 + generation;
    }
    return generation;
}

function pickBestInBattleDescription(inBattleContent: string): string {
    const subsections = collectGenerationSubsections(inBattleContent);
    if (subsections.length === 0) {
        return inBattleContent;
    }

    let best = subsections[0];
    let bestScore = scoreGenerationSubsection(best.title);
    for (let i = 1; i < subsections.length; i++) {
        const candidate = subsections[i];
        const score = scoreGenerationSubsection(candidate.title);
        if (score > bestScore) {
            best = candidate;
            bestScore = score;
        }
    }
    return best.content;
}

export function parseAbilityData(wikitext: string, abilityName: string): AbilityData {
    const infoboxDescription = extractInfoboxDescription(wikitext);
    if (infoboxDescription) {
        return { description: infoboxDescription };
    }

    const headings = collectHeadings(wikitext);
    const effect = extractSection(wikitext, headings, 2, 'Effect');
    if (!effect) {
        throw new Error(`[${abilityName}] Effect section not found on ability page`);
    }

    const inBattle =
        extractSection(wikitext, headings, 3, 'In battle', { start: effect.start, end: effect.end }) ??
        extractSection(wikitext, headings, 3, 'In-battle', { start: effect.start, end: effect.end }) ??
        extractSection(wikitext, headings, 3, 'In battle');

    if (!inBattle) {
        throw new Error(`[${abilityName}] In battle subsection not found in Effect section`);
    }

    const description = normalizeAbilityDescription(pickBestInBattleDescription(inBattle.content));
    if (!description) {
        throw new Error(`[${abilityName}] Parsed in-battle ability description is empty`);
    }

    return {
        description,
    };
}
