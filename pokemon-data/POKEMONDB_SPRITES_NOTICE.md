# Pokémon Database Sprites Notice

This package downloads Pokémon icon sprites from Pokémon Database (pokemondb.net)
into `artifacts/assets/` as part of the build.

Source URL pattern:
- `https://img.pokemondb.net/sprites/scarlet-violet/icon/avif/<slug>.avif`

Source and policy information:
- Pokémon Database About/FAQ: https://pokemondb.net/about
- Sprite archive: https://pokemondb.net/sprites

Stated policy (Pokémon Database FAQ, "Can I use some content from your site?"):
1. Their own written content, site design, and data display/layouts may NOT be reused.
2. Official Pokémon artwork and sprites are not their creations, are used by them
   under a fair use policy, and they state you are free to use them however you like.

What this means for this project:
- Only sprite image files are taken from pokemondb.net. No written content, page text,
  descriptions, or table/layout data is scraped from that site.
- Pokémon textual/reference data in this package comes from Bulbapedia instead; see
  `paldea-nuzlocke-guide/BULBAPEDIA_DATA_LICENSE.md`.

Important notes:
- The sprites are official game assets: Pokémon images & names © 1995-2026
  Nintendo/Game Freak/The Pokémon Company. Pokémon Database does not own them and
  cannot grant rights to them; their fair use position is not a license from the
  rights holders.
- Redistributing these files (for example by deploying `artifacts/assets/` to a host)
  relies on the same fan-project fair use posture. Keep usage non-commercial.
- Be a good neighbour with the source server: fetches are queued with a polite delay
  and cached on disk in `.cache/`, so a rebuild does not re-download.
- Alternative bulk sprite sources, if a cleaner provenance is ever needed:
  Veekun bulk image downloads (https://veekun.com/dex/downloads) and
  PokéAPI (https://pokeapi.co/).

Project note:
- If this project ever moves toward commercial distribution, these sprites must be
  removed or replaced with assets that are properly licensed for that use.
