// Single source of truth for Pokémon sprite paths, served from paldea-nuzlocke-guide/public/assets (see scripts/sync-pokemon-assets.mjs).
export { toIconSlug } from '@project-dragalge/pokemon-data/icon-slug';

export function pokemonIconSrc(slug: string): string {
    return `/assets/${slug}.avif`;
}
