export interface BaseStats {
    base_hp: number;
    base_attack: number;
    base_defense: number;
    base_sp_attack: number;
    base_sp_defense: number;
    base_speed: number;
}

export interface EvolutionEdge {
    from: string;
    to: string;
    method: string;
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

export function buildPageWikitextUrl(pageName: string): string {
    return `https://bulbapedia.bulbagarden.net/w/api.php?action=parse&page=${encodeURIComponent(pageName.replace(/ /g, '_'))}&prop=wikitext&format=json`;
}

export function buildMoveWikitextUrl(moveName: string): string {
    const pageName = `${moveName.replace(/ /g, '_')}_(move)`;
    return `https://bulbapedia.bulbagarden.net/w/api.php?action=parse&page=${encodeURIComponent(pageName)}&prop=wikitext&format=json`;
}

export function buildAbilityWikitextUrl(abilityName: string): string {
    const pageName = `${abilityName.replace(/ /g, '_')}_(Ability)`;
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
    'Bonsly',
    'Pikachu',
    'Masquerain',
    'Meditite',
    'Azumarill',
    'Jumpluff',
    'Pelipper',
    'Electrode',
    'Ampharos',
    'Medicham',
    'Beartic',
    'Cryogonal',
    'Wigglytuff',
    'Staraptor',
    'Qwilfish',
    'Raichu',
    'Dugtrio',
]);

function matchesIgnorePattern(heading: string, pattern: string): boolean {
    if (!pattern.includes('*')) {
        return heading.toLowerCase() === pattern.toLowerCase();
    }
    const regex = new RegExp(
        '^' +
            pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') +
            '$',
        'i',
    );
    return regex.test(heading);
}

export function extractTemplateAtPosition(
    wikitext: string,
    start: number,
): string | null {
    let depth = 0;
    let i = start;
    while (i < wikitext.length) {
        if (wikitext[i] === '{' && wikitext[i + 1] === '{') {
            depth++;
            i += 2;
        } else if (wikitext[i] === '}' && wikitext[i + 1] === '}') {
            depth--;
            i += 2;
            if (depth === 0) {
                return wikitext.slice(start, i);
            }
        } else {
            i++;
        }
    }
    return null;
}

// Counts {{ / }} pairs to extract a full template block without cutting at nested braces.
export function extractTemplate(
    wikitext: string,
    templateName: string,
): string | null {
    const start = wikitext.search(new RegExp(`\\{\\{\\s*${templateName}`, 'i'));
    return start === -1 ? null : extractTemplateAtPosition(wikitext, start);
}

export function extractTemplates(
    wikitext: string,
    templatePattern: RegExp,
): string[] {
    const results: string[] = [];
    let from = 0;
    while (from < wikitext.length) {
        const rel = wikitext.slice(from).search(templatePattern);
        if (rel === -1) {
            break;
        }
        const start = from + rel;
        const block = extractTemplateAtPosition(wikitext, start);
        if (block) {
            results.push(block);
            from = start + block.length;
            continue;
        }
        from = start + 2;
    }
    return results;
}

export function parseTemplateParameters(block: string): Record<string, string> {
    const params: Record<string, string> = {};
    const lines = block.slice(2, -2).split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('|')) {
            continue;
        }
        const equalsIndex = trimmed.indexOf('=');
        if (equalsIndex === -1) {
            continue;
        }
        const key = trimmed.slice(1, equalsIndex).trim().toLowerCase();
        params[key] = trimmed.slice(equalsIndex + 1).trim();
    }
    return params;
}

export function stripWikiMarkup(value: string): string {
    let text = value.replace(/<br\s*\/?\s*>/gi, ' + ');
    text = text.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2');
    text = text.replace(/\[\[([^\]]+)\]\]/g, '$1');
    text = text.replace(/\{\{\s*Bag\/s\|([^|}]+)(?:\|[^}]*)?\}\}/gi, '$1');
    text = text.replace(/\{\{\s*color2\|[^|}]+\|[^|}]+\|([^|}]+)\}\}/gi, '$1');
    text = text.replace(/\{\{\s*p\|([^}]+)\}\}/gi, '$1');
    text = text.replace(/\{\{\s*([^|}]+)\|([^}]+)\}\}/g, '$2');
    text = text.replace(/<[^>]+>/g, ' ');
    text = text.replace(/\b(?:link|t|t1|t2|s|v|gen|form)=/gi, '');
    text = text.replace(/\b\d+px\|/gi, '');
    text = text.replace(/\b\d+\|/g, '');
    text = text.replace(/\|/g, ' ');
    text = text.replace(/\s+/g, ' ').trim();
    return text;
}

function parseEvolutionMethod(value: string): string {
    const raw = value
        .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, '')
        .replace(/\{\{\s*Bag\/s\|[^}]*\}\}/gi, '')
        .replace(/\{\{\s*(?:acolor|mcolor)\|([^|}]+)(?:\|[^}]*)?\}\}/gi, '$1')
        .replace(/\{\{\s*color2\|[^|}]+\|([^|}]+)\}\}/gi, '$1');
    const lines = raw
        .replace(/<br\s*\/?\s*>/gi, '\n')
        .split(/\r?\n/)
        .map((line) =>
            stripWikiMarkup(line)
                .replace(/^\s*\+\s*|\s*\+\s*$/g, '')
                .trim(),
        )
        .filter((line) => line.length > 0);
    const method = lines
        .filter((line, index) => index === 0 || line !== lines[index - 1])
        .join(' ')
        .replace(/\blevel\s+(\d+)/gi, 'level $1');
    return method || 'unknown';
}

function cleanEvolutionPokemonName(value: string): string {
    return stripWikiMarkup(value).split('|', 1)[0].trim();
}

function resolveEvolutionPokemonName(name: string, form: string): string {
    const cleanedName = cleanEvolutionPokemonName(name);
    const cleanedForm = cleanEvolutionPokemonName(form);
    if (!cleanedName || !cleanedForm) {
        return cleanedName;
    }
    if (cleanedName === 'Oinkologne' && /^(male|female)$/i.test(cleanedForm)) {
        return `${cleanedName} ${cleanedForm}`;
    }
    const regionalForm = /^(Alolan|Galarian|Hisuian|Paldean)$/i.test(
        cleanedForm,
    )
        ? `${cleanedForm} Form`
        : cleanedForm;
    return `${cleanedName} (${regionalForm})`;
}

function parseEvoboxTemplate(block: string): EvolutionEdge[] {
    const params = parseTemplateParameters(block);
    const edges: EvolutionEdge[] = [];
    for (const key of Object.keys(params)) {
        const match = /^name(\d+)([a-z]?)$/i.exec(key);
        if (!match || Number(match[1]) < 2) {
            continue;
        }
        const targetStage = `${match[1]}${match[2]}`;
        const previousStage = Number(match[1]) - 1;
        const branchStage = `${previousStage}${match[2]}`;
        const sourceStage = params[`name${branchStage}`]
            ? branchStage
            : `${previousStage}`;
        const from = resolveEvolutionPokemonName(
            params[`name${sourceStage}`] ?? '',
            params[`form${sourceStage}`] ?? '',
        );
        const to = resolveEvolutionPokemonName(
            params[key],
            params[`form${targetStage}`] ?? '',
        );
        const method = (
            params[`evo${branchStage}`] ?? params[`evo${previousStage}`]
        )?.trim();
        if (!from || !to || !method) {
            continue;
        }
        edges.push({ from, to, method: parseEvolutionMethod(method) });
    }

    return edges;
}

function parseNarrativeEvolutionEdges(
    wikitext: string,
    pokemonName: string,
): EvolutionEdge[] {
    const matches = wikitext.matchAll(
        /([A-Za-z0-9'()\- ]+?)\s+evolves\s+into\s+\{\{p\|([^}]+)\}\}/gi,
    );
    const edges: EvolutionEdge[] = [];
    for (const match of matches) {
        const from = cleanEvolutionPokemonName(match[1]);
        const to = cleanEvolutionPokemonName(match[2]);
        if (
            from.length === 0 ||
            to.length === 0 ||
            from.toLowerCase() !== pokemonName.toLowerCase()
        ) {
            continue;
        }
        edges.push({ from, to, method: 'unknown' });
    }
    return edges;
}

function parseEvolutionTableEdges(wikitext: string): EvolutionEdge[] {
    const setups = extractTemplates(wikitext, /\{\{\s*Evobox\/Setup\|/i);
    const edges: EvolutionEdge[] = [];
    for (let index = 0; index < setups.length - 1; index += 1) {
        const source = setups[index];
        const target = setups[index + 1];
        if (
            !source.includes('|Unevolved') ||
            !target.includes('|First Evolution')
        ) {
            continue;
        }
        const sourceEnd = wikitext.indexOf(source) + source.length;
        const targetStart = wikitext.indexOf(target, sourceEnd);
        const condition = wikitext.slice(sourceEnd, targetStart);
        if (/^\s*\|[-}]/m.test(condition)) {
            continue;
        }
        const from = /^\{\{\s*Evobox\/Setup\|[^|]+\|([^|]+)/i.exec(source)?.[1];
        const to = /^\{\{\s*Evobox\/Setup\|[^|]+\|([^|]+)/i.exec(target)?.[1];
        if (!from || !to) {
            continue;
        }
        const methods = condition
            .replace(/^\s*\|[ \t]*/gm, '')
            .split(/\u2192|\u2193/)
            .map(parseEvolutionMethod)
            .filter((method) => method !== 'unknown');
        if (methods.length > 0) {
            edges.push({
                from: cleanEvolutionPokemonName(from),
                to: cleanEvolutionPokemonName(to),
                method: methods.join(' or '),
            });
        }
    }
    return edges;
}

function normalizeEvolutionMethod(method: string): string {
    return method.toLowerCase().replaceAll(',', '').replace(/\s+/g, ' ').trim();
}

function isGenderOnlyMethod(method: string): boolean {
    return /^(?:female|male)(?: only)?$/i.test(method.trim());
}

function normalizeFormName(form: string): string {
    return form
        .toLowerCase()
        .replace(/\bform\b/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
}

export function consolidateEvolutionEdges(
    edges: EvolutionEdge[],
): EvolutionEdge[] {
    const edgesByPair = new Map<string, EvolutionEdge[]>();
    for (const edge of edges) {
        if (
            normalizeEvolutionMethod(edge.method) === 'unknown' &&
            edges.some(
                (candidate) =>
                    candidate.from === edge.from &&
                    candidate.to !== edge.to &&
                    candidate.to.replace(/\s*\([^)]+\)$/, '') === edge.to,
            )
        ) {
            continue;
        }
        const key = `${edge.from}\u0000${edge.to}`;
        const pairEdges = edgesByPair.get(key);
        if (pairEdges) {
            pairEdges.push(edge);
        } else {
            edgesByPair.set(key, [edge]);
        }
    }

    const consolidated: EvolutionEdge[] = [];
    for (const pairEdges of edgesByPair.values()) {
        const informativeEdges = pairEdges.filter(
            (edge) => normalizeEvolutionMethod(edge.method) !== 'unknown',
        );
        const candidateEdges =
            informativeEdges.length > 0 ? informativeEdges : pairEdges;
        const uniqueEdges = candidateEdges.filter((edge, index) =>
            candidateEdges
                .slice(0, index)
                .every(
                    (previous) =>
                        normalizeEvolutionMethod(previous.method) !==
                        normalizeEvolutionMethod(edge.method),
                ),
        );
        const genderEdges = uniqueEdges.filter((edge) =>
            isGenderOnlyMethod(edge.method),
        );
        const requirementEdges = uniqueEdges.filter(
            (edge) => !isGenderOnlyMethod(edge.method),
        );

        if (genderEdges.length > 0 && requirementEdges.length === 1) {
            consolidated.push({
                ...requirementEdges[0],
                method: [...genderEdges, ...requirementEdges]
                    .map((edge) => edge.method)
                    .join(', '),
            });
        } else {
            consolidated.push(...uniqueEdges);
        }
    }
    return consolidated;
}

export function parseEvolutionEdges(
    wikitext: string,
    pokemonName: string,
): EvolutionEdge[] {
    const text = wikitext.replace(/<!--[\s\S]*?-->/g, '');
    const evolutionSection =
        /(?:^|\n)===\s*Evolution data\s*===\s*\n([\s\S]*?)(?=\n==[^=]|\n===[^=]|$)/i.exec(
            text,
        )?.[1];
    const templatePattern =
        /\{\{\s*Evobox(?:-\d+|\/(?:1branch\d+|2branch[12]))\s*(?=\||\r?\n|\}\})/i;
    const detailedEdges = evolutionSection
        ? [
              ...extractTemplates(evolutionSection, templatePattern).flatMap(
                  parseEvoboxTemplate,
              ),
              ...parseEvolutionTableEdges(evolutionSection),
          ]
        : [];
    const templateEdges = extractTemplates(text, templatePattern).flatMap(
        parseEvoboxTemplate,
    );
    const edges = detailedEdges.length > 0 ? detailedEdges : templateEdges;
    if (edges.length > 0) {
        return consolidateEvolutionEdges(edges);
    }
    return parseNarrativeEvolutionEdges(text, pokemonName);
}

function collectStatsBlocks(
    wikitext: string,
): { block: string; start: number }[] {
    const results: { block: string; start: number }[] = [];
    const seen = new Set<number>();
    for (const name of ['BaseStats', 'Stats', 'Base stats']) {
        const pattern = new RegExp(`\\{\\{\\s*${name}`, 'i');
        let from = 0;
        while (from < wikitext.length) {
            const rel = wikitext.slice(from).search(pattern);
            if (rel === -1) {
                break;
            }
            const start = from + rel;
            if (!seen.has(start)) {
                const block = extractTemplateAtPosition(wikitext, start);
                if (block) {
                    seen.add(start);
                    results.push({ block, start });
                    from = start + block.length;
                    continue;
                }
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
    while (true) {
        const m = re.exec(before);
        if (m === null) {
            break;
        }
        last = m[1].trim();
    }
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

export function parseBaseStats(
    wikitext: string,
    pokemonName?: string,
): BaseStats | null {
    const all = collectStatsBlocks(wikitext);
    if (all.length === 0) {
        const idx = wikitext.search(/={2,4}\s*(?:Base\s*)?[Ss]tats/);
        const snippet =
            idx >= 0 ? wikitext.slice(idx, idx + 400) : wikitext.slice(0, 400);
        process.stderr.write(
            `[parseBaseStats] no template found:\n${snippet}\n---\n`,
        );
        return null;
    }
    const requestedForm = /\(([^)]+)\)$/.exec(pokemonName ?? '')?.[1];
    const formStats = requestedForm
        ? all.filter(({ start }) =>
              ` ${normalizeFormName(findPrecedingHeading(wikitext, start))} `.includes(
                  ` ${normalizeFormName(requestedForm)} `,
              ),
          )
        : [];
    const relevant = all.filter(({ start }) => {
        const heading = findPrecedingHeading(wikitext, start);
        const ignored = STATS_IGNORE_PATTERNS.some((p) =>
            matchesIgnorePattern(heading, p),
        );
        return !ignored;
    });
    const candidates =
        formStats.length > 0 ? formStats : relevant.length > 0 ? relevant : all;
    if (candidates.length === 1) {
        return parseStatsBlock(candidates[0].block);
    }
    const allStats = candidates.map((c) => parseStatsBlock(c.block));
    const first = allStats[0];
    const allMatch = allStats.every(
        (s) =>
            s.base_hp === first.base_hp &&
            s.base_attack === first.base_attack &&
            s.base_defense === first.base_defense &&
            s.base_sp_attack === first.base_sp_attack &&
            s.base_sp_defense === first.base_sp_defense &&
            s.base_speed === first.base_speed,
    );
    if (allMatch) {
        return first;
    }
    const headings = candidates.map(({ start }) =>
        findPrecedingHeading(wikitext, start),
    );
    const allSameHeading = headings.every((h) => h === headings[0]);
    if (
        allSameHeading &&
        pokemonName &&
        LATE_GEN_STAT_CHANGES.has(pokemonName.replace(/\s*\([^)]+\)$/, ''))
    ) {
        return parseStatsBlock(candidates[candidates.length - 1].block);
    }
    return null;
}

export function parseTypes(
    wikitext: string,
    pokemonName?: string,
): {
    primary_type: string;
    secondary_type: string;
} {
    // Scope to the infobox to avoid false matches in moveset or form sections
    const scope = extractTemplate(wikitext, 'Pokémon Infobox') ?? wikitext;
    const params = parseTemplateParameters(scope);
    const requestedForm = /\(([^)]+)\)$/.exec(pokemonName ?? '')?.[1];
    const formKey = requestedForm
        ? Object.keys(params).find(
              (key) =>
                  /^form\d+$/.test(key) &&
                  normalizeFormName(params[key]) ===
                      normalizeFormName(requestedForm),
          )
        : undefined;
    const formPrefix = formKey && params[`${formKey}type1`] ? formKey : '';
    const primary_type = (params[`${formPrefix}type1`] ?? '').toLowerCase();
    const raw2 = (params[`${formPrefix}type2`] ?? '').toLowerCase();
    // Bulbapedia sometimes mirrors type1 into type2 for display; treat that as no secondary
    const secondary_type = raw2 === primary_type ? '' : raw2;
    return { primary_type, secondary_type };
}
