# Game Progression Roadmap

This is a planning reference for the Paldea Nuzlocke tracker. It is not runtime data and must not be imported by the app. The active progression is declared directly, in story order, in `app/src/views/Game/Game.tsx`. Add a progression component there when its implementation is ready.

The canonical order lives in the `PROGRESSION` array (encounter/boss/starter interleaved as the player would hit them). The table below mirrors that array's order exactly — do not re-sort or split it by entry type, since the relative order between encounters and bosses is the whole point of the data.

## Current Runtime Order

1. Starter
2. Poco Path
3. Inlet Grotto

## Full Progression Order

Legend: **Boss type** — Rival / Gym / Titan / Starfall / Elite Four. "Implemented" marks entries with `isImplemented: true` in `PROGRESSION` (independent from what's actually wired into `Game.tsx`, see Current Runtime Order above).

| # | Kind | Name | Boss Type | Level Cap | Province / Location | Implemented |
| ---: | --- | --- | --- | ---: | --- | :---: |
| 1 | Starter | Starter | — | — | — | |
| 2 | Encounter | Poco Path | — | — | South Province | ✅ |
| 3 | Encounter | Inlet Grotto | — | — | South Province | |
| 4 | Encounter | South Province (Area One) | — | — | South Province | |
| 5 | Boss | Nemona (First Battle) | Rival | 9 | South Province (Area One) | |
| 6 | Encounter | Pokemon League (Paldea) | — | — | South Province | |
| 7 | Encounter | South Province (Area Two) | — | — | South Province | |
| 8 | Boss | Katy (Bug Gym) | Gym | 15 | Cortondo | |
| 9 | Encounter | South Province (Area Three) | — | — | South Province | |
| 10 | Boss | Klawf (Stony Cliff Titan) | Titan | 16 | South Province (Area Three) | |
| 11 | Boss | Brassius (Grass Gym) | Gym | 17 | Artazon | |
| 12 | Encounter | West Province (Area One) | — | — | West Province | |
| 13 | Boss | Bombirdier (Open Sky Titan) | Titan | 20 | West Province (Area One) | |
| 14 | Encounter | South Province (Area Four) | — | — | South Province | |
| 15 | Boss | Giacomo (Dark Star) | Starfall | 21 | West Province (Area One) | |
| 16 | Encounter | East Province (Area One) | — | — | East Province | |
| 17 | Encounter | East Province (Area Two) | — | — | East Province | |
| 18 | Encounter | South Province (Area Five) | — | — | South Province | |
| 19 | Encounter | South Paldean Sea | — | — | South Province | |
| 20 | Boss | Iono (Electric Gym) | Gym | 24 | Levincia | |
| 21 | Encounter | Asado Desert | — | — | West Province | |
| 22 | Encounter | East Paldean Sea | — | — | East Province | |
| 23 | Encounter | East Province (Area Three) | — | — | East Province | |
| 24 | Boss | Mela (Fire Star) | Starfall | 27 | East Province (Area One) | |
| 25 | Encounter | West Province (Area Two) | — | — | West Province | |
| 26 | Boss | Kofu (Water Gym) | Gym | 30 | Cascarrafa | |
| 27 | Boss | Orthworm (Lurking Steel Titan) | Titan | 29 | East Province (Area Three) | |
| 28 | Encounter | Tagtree Thicket | — | — | East Province | |
| 29 | Encounter | West Province (Area Three) | — | — | West Province | |
| 30 | Boss | Atticus (Poison Star) | Starfall | 33 | Tagtree Thicket | |
| 31 | Encounter | West Paldean Sea | — | — | West Province | |
| 32 | Encounter | Dalizapa Passage | — | — | North Province | |
| 33 | Boss | Larry (Normal Gym) | Gym | 36 | Medali | |
| 34 | Encounter | Glaseado Mountain | — | — | North Province | |
| 35 | Boss | Ryme (Ghost Gym) | Gym | 42 | Montenevera | |
| 36 | Encounter | South Province (Area Six) | — | — | South Province | |
| 37 | Encounter | Alfornada Cavern | — | — | South Province | |
| 38 | Boss | Great Tusk/Iron Treads (Quaking Earth Titan) | Titan | 45 | Asado Desert | |
| 39 | Boss | Tulip (Psychic Gym) | Gym | 45 | Alfornada | |
| 40 | Encounter | North Paldean Sea | — | — | North Province | |
| 41 | Encounter | North Province (Area Three) | — | — | North Province | |
| 42 | Boss | Grusha (Ice Gym) | Gym | 48 | Glaseado Mountain | |
| 43 | Boss | Ortega (Fairy Star) | Starfall | 50 | North Province (Area One) | |
| 44 | Encounter | Socarrat Trail | — | — | North Province | |
| 45 | Encounter | North Province (Area One) | — | — | North Province | |
| 46 | Encounter | North Province (Area Two) | — | — | North Province | |
| 47 | Encounter | Casseroya Lake | — | — | North Province | |
| 48 | Boss | Eri (Fighting Star) | Starfall | 56 | North Province (Area Three) | |
| 49 | Boss | Dondozo (False Dragon Titan) | Titan | 56 | Casseroya Lake | |
| 50 | Boss | Rika (Elite Four) | Elite Four | 58 | Pokemon League | |
| 51 | Boss | Poppy (Elite Four) | Elite Four | 59 | Pokemon League | |
| 52 | Boss | Larry (Elite Four) | Elite Four | 60 | Pokemon League | |
| 53 | Boss | Hassel (Elite Four) | Elite Four | 61 | Pokemon League | |
| 54 | Boss | Geeta (Top Champion) | Elite Four | 62 | Pokemon League | |
| 55 | Boss | Nemona (Final Battle) | Rival | 66 | Mesagoza | |

