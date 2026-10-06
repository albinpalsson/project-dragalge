import { readdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseLocationEncounters } from '../src/fetch/bulbapedia-location-parser.ts';
import { buildPageWikitextUrl } from '../src/fetch/bulbapedia-parser.ts';
import { cachedFetcher } from '../src/fetch/cached-fetcher.ts';

const PAGE_OVERRIDES: Record<string, string> = {
    'pokemon-league.json': 'Pok\u00e9mon League (Paldea)',
};

const directory = new URL('../src/sources/locations/', import.meta.url);
const files = (await readdir(directory))
    .filter((file) => file.endsWith('.json'))
    .sort();
const updated: string[] = [];
const unchanged: string[] = [];
const skipped: string[] = [];

for (const file of files) {
    const target = new URL(file, directory);
    const temporary = `${fileURLToPath(target)}.tmp`;
    let stage = 'read';
    try {
        const original = await readFile(target, 'utf8');
        const location = JSON.parse(original.replace(/^\uFEFF/, ''));
        if (typeof location.name !== 'string') {
            throw new Error('Missing location name');
        }
        stage = 'fetch';
        const response = JSON.parse(
            await cachedFetcher.get(
                buildPageWikitextUrl(PAGE_OVERRIDES[file] ?? location.name),
            ),
        );
        if (response.error) {
            throw new Error(response.error.info ?? response.error.code);
        }
        const wikitext = response.parse?.wikitext?.['*'];
        if (typeof wikitext !== 'string') {
            throw new Error('Missing API wikitext');
        }
        stage = 'parse';
        const subAreas = parseLocationEncounters(wikitext);
        const count = subAreas.reduce(
            (total, area) => total + area.encounters.length,
            0,
        );
        if (JSON.stringify(location.subAreas) === JSON.stringify(subAreas)) {
            unchanged.push(`${file}: ${count} encounters`);
            continue;
        }
        location.subAreas = subAreas;
        const newline = original.includes('\r\n') ? '\r\n' : '\n';
        const suffix = original.endsWith('\n') ? newline : '';
        const output =
            JSON.stringify(location, null, 4).replace(/\n/g, newline) + suffix;
        stage = 'write';
        await writeFile(temporary, output, 'utf8');
        await rename(temporary, target);
        updated.push(`${file}: ${count} encounters`);
    } catch (error) {
        await rm(temporary, { force: true });
        skipped.push(
            `${file} (${stage}): ${error instanceof Error ? error.message : String(error)}`,
        );
    }
}

console.log(`\nUpdated ${updated.length}/${files.length} locations:`);
for (const message of updated) {
    console.log(`  ${message}`);
}
console.log(`\nUnchanged ${unchanged.length} locations:`);
for (const message of unchanged) {
    console.log(`  ${message}`);
}
console.log(`\nSkipped ${skipped.length} locations (files untouched):`);
for (const message of skipped) {
    console.log(`  ${message}`);
}
