export interface BaseStats {
    base_hp: number;
    base_attack: number;
    base_defense: number;
    base_sp_attack: number;
    base_sp_defense: number;
    base_speed: number;
}

// Encounter names that don't map directly to a Bulbapedia page name
const POKEMON_PAGE_NAME: Record<string, string> = {
    'Deerling Autumn Form': 'Deerling',
    'Sawsbuck Autumn Form': 'Sawsbuck',
    'Oinkologne Male': 'Oinkologne',
    'Oinkologne Female': 'Oinkologne',
    'Basculin Red': 'Basculin',
    'Basculin Blue': 'Basculin',
};

export function buildWikitextUrl(name: string): string {
    const nfcName = name.normalize('NFC');
    const override = POKEMON_PAGE_NAME[nfcName];
    const baseName = override ?? nfcName.replace(/\s*\([^)]+\)$/, '').trim();
    const pageName = `${baseName.replace(/ /g, '_')}_(Pokémon)`;
    return `https://bulbapedia.bulbagarden.net/w/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json`;
}

// Stats block headings matching these patterns are excluded before comparing or returning
export const STATS_IGNORE_PATTERNS: string[] = [
    '*Mega*',
    '*Alolan*',
    '*Galarian*',
    '*Hisuian*',
    '*Eternal*',
    '*Partner*',
];

// Pokemon whose pages have two same-heading stat blocks due to old-gen stat changes
export const LATE_GEN_STAT_CHANGES = new Set<string>([
    'Bonsly', 'Pikachu', 'Masquerain', 'Meditite', 'Azumarill',
    'Jumpluff', 'Pelipper', 'Electrode', 'Ampharos', 'Medicham',
    'Beartic', 'Cryogonal', 'Wigglytuff', 'Staraptor', 'Qwilfish',    'Raichu', 'Dugtrio',]);

function matchesIgnorePattern(heading: string, pattern: string): boolean {
    if (!pattern.includes('*')) return heading.toLowerCase() === pattern.toLowerCase();
    const regex = new RegExp(
        '^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$',
        'i',
    );
    return regex.test(heading);
}

function extractTemplateAtPosition(wikitext: string, start: number): string | null {
    let depth = 0;
    let i = start;
    while (i < wikitext.length) {
        if (wikitext[i] === '{' && wikitext[i + 1] === '{') { depth++; i += 2; }
        else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
            depth--; i += 2;
            if (depth === 0) return wikitext.slice(start, i);
        } else { i++; }
    }
    return null;
}

// Counts {{ / }} pairs to extract a full template block without cutting at nested braces.
function extractTemplate(wikitext: string, templateName: string): string | null {
    const start = wikitext.search(new RegExp(`\\{\\{\\s*${templateName}`, 'i'));
    return start === -1 ? null : extractTemplateAtPosition(wikitext, start);
}

function collectStatsBlocks(wikitext: string): { block: string; start: number }[] {
    const results: { block: string; start: number }[] = [];
    const seen = new Set<number>();
    for (const name of ['BaseStats', 'Stats', 'Base stats']) {
        const pattern = new RegExp(`\\{\\{\\s*${name}`, 'i');
        let from = 0;
        while (from < wikitext.length) {
            const rel = wikitext.slice(from).search(pattern);
            if (rel === -1) break;
            const start = from + rel;
            if (!seen.has(start)) {
                const block = extractTemplateAtPosition(wikitext, start);
                if (block) { seen.add(start); results.push({ block, start }); from = start + block.length; continue; }
            }
            from = start + 2;
        }
    }
    return results.sort((a, b) => a.start - b.start);
}

function findPrecedingHeading(wikitext: string, blockStart: number): string {
    const before = wikitext.slice(0, blockStart);
    let last = '';
    const re = /^={2,5}([^=\n]+)={2,5}/gm;
    let m: RegExpExecArray | null;
    while ((m = re.exec(before)) !== null) last = m[1].trim();
    return last;
}

function getNumParam(block: string, key: string): number {
    const match = new RegExp(`\\|\\s*${key}\\s*=\\s*(\\d+)`, 'i').exec(block);
    return match ? parseInt(match[1], 10) : 0;
}

function parseStatsBlock(block: string): BaseStats {
    return {
        base_hp: getNumParam(block, 'HP'),
        base_attack: getNumParam(block, 'Attack'),
        base_defense: getNumParam(block, 'Defense'),
        base_sp_attack: getNumParam(block, 'SpAtk'),
        base_sp_defense: getNumParam(block, 'SpDef'),
        base_speed: getNumParam(block, 'Speed'),
    };
}

export function parseBaseStats(wikitext: string, pokemonName?: string): BaseStats | null {
    const all = collectStatsBlocks(wikitext);
    if (all.length === 0) {
        const idx = wikitext.search(/={2,4}\s*(?:Base\s*)?[Ss]tats/);
        const snippet = idx >= 0 ? wikitext.slice(idx, idx + 400) : wikitext.slice(0, 400);
        process.stderr.write(`[parseBaseStats] no template found:\n${snippet}\n---\n`);
        return null;
    }
    const relevant = all.filter(({ start }) => {
        const heading = findPrecedingHeading(wikitext, start);
        const ignored = STATS_IGNORE_PATTERNS.some((p) => matchesIgnorePattern(heading, p));
        return !ignored;
    });
    const candidates = relevant.length > 0 ? relevant : all;
    if (candidates.length === 1) return parseStatsBlock(candidates[0].block);
    const allStats = candidates.map((c) => parseStatsBlock(c.block));
    const first = allStats[0];
    const allMatch = allStats.every(
        (s) => s.base_hp === first.base_hp && s.base_attack === first.base_attack && s.base_defense === first.base_defense
            && s.base_sp_attack === first.base_sp_attack && s.base_sp_defense === first.base_sp_defense && s.base_speed === first.base_speed,
    );
    if (allMatch) return first;
    const headings = candidates.map(({ start }) => findPrecedingHeading(wikitext, start));
    const allSameHeading = headings.every((h) => h === headings[0]);
    if (allSameHeading && pokemonName && LATE_GEN_STAT_CHANGES.has(pokemonName)) {
        return parseStatsBlock(candidates[candidates.length - 1].block);
    }
    return null;
}

export function parseTypes(wikitext: string): { primary_type: string; secondary_type: string } {
    // Scope to the infobox to avoid false matches in moveset or form sections
    const scope = extractTemplate(wikitext, 'Pokémon Infobox') ?? wikitext;
    const primary_type = /\|\s*type1\s*=\s*(\w+)/i.exec(scope)?.[1]?.toLowerCase() ?? '';
    const raw2 = /\|\s*type2\s*=\s*(\w+)/i.exec(scope)?.[1]?.toLowerCase() ?? '';
    // Bulbapedia sometimes mirrors type1 into type2 for display; treat that as no secondary
    const secondary_type = raw2 === primary_type ? '' : raw2;
    return { primary_type, secondary_type };
}
