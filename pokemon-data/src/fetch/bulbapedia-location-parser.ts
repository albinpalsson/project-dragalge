import {
    extractTemplateAtPosition,
    stripWikiMarkup,
} from './bulbapedia-parser.ts';

const BIOMES: Record<string, string> = {
    P: 'Prairie',
    Fo: 'Forest',
    T: 'Town',
    D: 'Desert',
    Mo: 'Mountain',
    Sn: 'Snowfield',
    Sw: 'Swamp',
    L: 'Lake',
    Ri: 'Riverside',
    Oc: 'Ocean',
    U: 'Underground',
    Ro: 'Rocky Area',
    Ca: 'Cave',
    Be: 'Beach',
    Fl: 'Flower',
    Ba: 'Bamboo Forest',
    W: 'Wasteland',
    V: 'Volcano',
    Mi: 'Mine',
    Ol: 'Olive',
    Ru: 'Ruins',
    Cw: 'Cave Water',
    Cs: 'Chargestone',
};

const TERRAIN: Record<string, string> = {
    land: 'land',
    watersurface: 'water_surface',
    underwater: 'underwater',
    overland: 'overland',
    sky: 'sky',
};

interface Encounter {
    pokemon: string;
    games: string[];
    terrain: string[];
    levels: { min: number; max: number };
    subArea: string;
    groupRate?: string;
    groupPokemon?: string;
    note?: string;
    probabilityByTime: {
        morning: number;
        day: number;
        evening: number;
        night: number;
    };
}

export interface LocationSubArea {
    name: string;
    encounters: Encounter[];
}

function parseParameters(block: string): Record<string, string> {
    const parts: string[] = [];
    const inner = block.slice(2, -2);
    let depth = 0;
    let current = '';
    for (let index = 0; index < inner.length; index++) {
        const char = inner[index];
        if ((char === '{' || char === '[') && inner[index + 1] === char) {
            depth++;
            current += char + char;
            index++;
        } else if (
            (char === '}' || char === ']') &&
            inner[index + 1] === char
        ) {
            depth--;
            current += char + char;
            index++;
        } else if (char === '|' && depth === 0) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);
    const params: Record<string, string> = {};
    let position = 1;
    for (const part of parts.slice(1)) {
        const named = /^\s*([\w]+)\s*=([\s\S]*)$/.exec(part);
        if (named) {
            params[named[1].toLowerCase()] = named[2].trim();
        } else {
            params[String(position++)] = part.trim();
        }
    }
    return params;
}

function cleanText(value: string): string {
    return stripWikiMarkup(
        value
            .replace(/&nbsp;|&#160;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&#39;|&apos;/g, "'")
            .replace(/&quot;/g, '"'),
    );
}

function numeric(value: string | undefined, label: string): number {
    if (value === '?' && label.includes('weight')) {
        return 0;
    }
    if (value === undefined || !/^\d+(?:\.\d+)?$/.test(value)) {
        throw new Error(`Unsupported ${label}: ${value ?? 'missing'}`);
    }
    return Number(value);
}

function parseEncounter(block: string, subArea: string): Encounter {
    const params = parseParameters(block);
    const allowed = new Set([
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        'type1',
        'type2',
        'form',
        'formlink',
        ...Object.keys(TERRAIN),
        'all',
        'morning',
        'day',
        'evening',
        'night',
        'group',
        'groupmon',
        'groupnum',
        'groupform',
        'note',
        'notename',
    ]);
    for (const key of Object.keys(params)) {
        if (!allowed.has(key)) {
            throw new Error(`Unsupported encounter parameter: ${key}`);
        }
    }
    const species = cleanText(params['2'] ?? '');
    const form = cleanText(params.form ?? '');
    if (!species || /[{}|]|&\w+;/.test(species + form)) {
        throw new Error('Unsupported Pokemon name or form');
    }
    const games: string[] = [];
    for (const [position, game] of [
        ['3', 'S'],
        ['4', 'V'],
    ]) {
        const available = params[position]?.toLowerCase();
        if (available !== 'yes' && available !== 'no') {
            throw new Error(`Unsupported game availability: ${species}`);
        }
        if (available === 'yes') {
            games.push(game);
        }
    }
    const terrain: string[] = [];
    for (const [key, name] of Object.entries(TERRAIN)) {
        const flag = params[key]?.toLowerCase();
        if (flag !== undefined && flag !== 'yes' && flag !== 'no') {
            throw new Error(`Unsupported terrain: ${key}=${flag}`);
        }
        if (flag === 'yes') {
            terrain.push(name);
        }
    }
    const ranges = (params['5'] ?? '')
        .split(',')
        .map((range) => /^(\d+)(?:\s*[-\u2013]\s*(\d+))?$/.exec(range.trim()));
    if (ranges.some((range) => !range) || !games.length || !terrain.length) {
        throw new Error(
            `Missing or unsupported levels/games/terrain: ${species}`,
        );
    }
    const bounds = ranges.map((range) => ({
        min: Number(range?.[1]),
        max: Number(range?.[2] ?? range?.[1]),
    }));
    if (bounds.some(({ min, max }) => min < 1 || max > 100 || min > max)) {
        throw new Error(`Invalid level range: ${species}`);
    }
    const min = Math.min(...bounds.map((range) => range.min));
    const max = Math.max(...bounds.map((range) => range.max));
    const base =
        params.all !== undefined && params.all !== ''
            ? numeric(params.all, 'all-time weight')
            : numeric(params['6'], 'spawn weight');
    const timeWeight = (time: string): number =>
        params.all !== undefined && params.all !== ''
            ? base
            : params[time] !== undefined
              ? numeric(params[time], `${time} weight`)
              : base;
    const encounter: Omit<Encounter, 'probabilityByTime'> = {
        pokemon: form ? `${species} (${form})` : species,
        games,
        terrain,
        levels: { min, max },
        subArea,
    };
    if (params.group) {
        encounter.groupRate = `${numeric(params.group, 'group rate')}%`;
        encounter.groupPokemon = cleanText(params.groupmon || species);
    }
    if (params.note) {
        encounter.note = cleanText(params.note);
    }
    return {
        ...encounter,
        probabilityByTime: {
            morning: timeWeight('morning'),
            day: timeWeight('day'),
            evening: timeWeight('evening'),
            night: timeWeight('night'),
        },
    };
}

export function parseLocationEncounters(wikitext: string): LocationSubArea[] {
    const section =
        /^==\s*Pok\u00e9mon\s*==\s*$([\s\S]*?)(?=^==[^=]|$(?![\s\S]))/m.exec(
            wikitext,
        )?.[1];
    if (!section) {
        throw new Error('No standard Pokemon section');
    }
    const regularSection = section.split(
        /^===\s*(?:Fixed|Terastallized|Special) encounters\s*===\s*$/im,
        1,
    )[0];
    let remaining = regularSection.replace(/<!--[\s\S]*?-->/g, '');
    const tables: string[] = [];
    let surrounding = '';
    while (true) {
        const start = remaining.search(/\{\{\s*Catch\/header\/9\s*[|}]/i);
        if (start < 0) {
            surrounding += remaining;
            break;
        }
        const footerMatch = /\{\{\s*Catch\/footer\/9\s*[|}]/i.exec(
            remaining.slice(start),
        );
        if (!footerMatch) {
            throw new Error('No complete standard encounter table');
        }
        const footerStart = start + footerMatch.index;
        const footerBlock = extractTemplateAtPosition(remaining, footerStart);
        if (!footerBlock) {
            throw new Error('Incomplete encounter table footer');
        }
        const end = footerStart + footerBlock.length;
        surrounding += remaining.slice(0, start);
        tables.push(remaining.slice(start, end));
        remaining = remaining.slice(end);
    }
    if (/\{\{\s*Catch\//i.test(surrounding)) {
        throw new Error('Additional encounter tables outside standard table');
    }
    const text = tables.join('\n').trim();
    const subAreas: LocationSubArea[] = [];
    let current: LocationSubArea | undefined;
    let header = false;
    let footer = false;
    let cursor = 0;
    while (cursor < text.length) {
        if (/\s/.test(text[cursor])) {
            cursor++;
            continue;
        }
        const block = extractTemplateAtPosition(text, cursor);
        if (!text.startsWith('{{', cursor) || !block) {
            throw new Error('Nonstandard encounter table content');
        }
        const name = block.slice(2, -2).split('|', 1)[0].trim().toLowerCase();
        if (name === 'catch/header/9' && (!header || footer)) {
            header = true;
            footer = false;
            current = undefined;
        } else if (name === 'catch/footer/9' && header && !footer) {
            footer = true;
        } else if (header && !footer && name === 'catch/div/9') {
            const code = parseParameters(block)['1'];
            const biome = BIOMES[code];
            if (!biome) {
                throw new Error(`Unknown biome: ${code}`);
            }
            current = subAreas.find((area) => area.name === biome);
            if (!current) {
                current = { name: biome, encounters: [] };
                subAreas.push(current);
            }
        } else if (header && !footer && current && name === 'catch/entry9') {
            current.encounters.push(parseEncounter(block, current.name));
        } else {
            throw new Error(`Unsupported table template or structure: ${name}`);
        }
        cursor += block.length;
    }
    if (
        !header ||
        !footer ||
        !subAreas.length ||
        subAreas.some((area) => !area.encounters.length)
    ) {
        throw new Error('Incomplete or empty encounter table');
    }
    return subAreas;
}
