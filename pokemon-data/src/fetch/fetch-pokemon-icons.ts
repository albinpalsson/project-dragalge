import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { toIconSlug } from '../icon-slug.cjs';
import { cachedFetcher } from './cached-fetcher.ts';

const ICON_BASE_URL =
    'https://img.pokemondb.net/sprites/scarlet-violet/icon/avif';

// Usage terms for these sprites: pokemon-data/POKEMONDB_SPRITES_NOTICE.md
const ATTRIBUTION = `Pokémon icon sprites fetched from Pokémon Database (${ICON_BASE_URL}).
Pokémon images & names © 1995-2026 Nintendo/Game Freak/The Pokémon Company.
Pokémon Database says it uses these official assets under its fair-use policy and considers them free to use. This is not a license or permission from the rights holders.
PokéDB is an unofficial, non-commercial fan project; this describes the project's intended use and does not grant rights to these assets.
See the Licenses & Notices page for full attribution and rights information.
`;

export interface FetchPokemonIconsResult {
    written: string[];
    totalBytes: number;
}

export async function fetchPokemonIcons(
    names: readonly string[],
    assetsDir: string,
): Promise<FetchPokemonIconsResult> {
    // Form aliases collapse onto one icon, so fetch per slug rather than per name.
    const slugs = [...new Set(names.map(toIconSlug))].sort();

    const tasks = slugs.map(async (slug) => {
        const url = `${ICON_BASE_URL}/${slug}.avif`;
        const bytes = await cachedFetcher.getBinary(url);
        const fileName = `${slug}.avif`;
        await writeFile(join(assetsDir, fileName), bytes);
        return { fileName, byteLength: bytes.byteLength };
    });

    const settled = await Promise.allSettled(tasks);
    const written: string[] = [];
    let totalBytes = 0;
    let failed = false;

    for (const result of settled) {
        if (result.status === 'fulfilled') {
            written.push(result.value.fileName);
            totalBytes += result.value.byteLength;
            continue;
        }
        failed = true;
        process.stderr.write(
            `${result.reason instanceof Error ? result.reason.message : String(result.reason)}\n`,
        );
    }

    if (failed) {
        throw new Error('Some pokemon icons failed to fetch/write');
    }

    // Keep attribution with the files so deployed copies carry it.
    await writeFile(join(assetsDir, 'ATTRIBUTION.txt'), ATTRIBUTION, 'utf-8');

    return { written, totalBytes };
}
