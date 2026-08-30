// Single source of truth for Pokémon sprite paths, served from app/public/assets (see scripts/sync-pokemon-assets.mjs).
export function pokemonIconSrc(slug: string): string {
    return `/assets/${slug}.avif`;
}
