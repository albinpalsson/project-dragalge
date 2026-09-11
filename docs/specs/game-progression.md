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
| 2 | Boss | Nemona (First Battle) | Rival | 5 | Cabo Poco | |
| 3 | Encounter | Poco Path | — | — | South Province | ✅ |
| 4 | Encounter | Inlet Grotto | — | — | South Province | |
| 5 | Encounter | South Province (Area One) | — | — | South Province | |
| 6 | Boss | Nemona (Second Battle) | Rival | 9 | South Province (Area One) | |
| 7 | Encounter | Pokemon League (Paldea) | — | — | South Province | |
| 8 | Encounter | South Province (Area Two) | — | — | South Province | |
| 9 | Boss | Katy (Bug Gym) | Gym | 15 | Cortondo | |
| 10 | Encounter | South Province (Area Three) | — | — | South Province | |
| 11 | Boss | Klawf (Stony Cliff Titan) | Titan | 16 | South Province (Area Three) | |
| 12 | Boss | Brassius (Grass Gym) | Gym | 17 | Artazon | |
| 13 | Encounter | West Province (Area One) | — | — | West Province | |
| 14 | Boss | Bombirdier (Open Sky Titan) | Titan | 20 | West Province (Area One) | |
| 15 | Encounter | South Province (Area Four) | — | — | South Province | |
| 16 | Boss | Giacomo (Dark Star) | Starfall | 21 | West Province (Area One) | |
| 17 | Boss | Nemona (Third Battle) | Rival | 22 | Levincia | |
| 18 | Encounter | East Province (Area One) | — | — | East Province | |
| 19 | Encounter | East Province (Area Two) | — | — | East Province | |
| 20 | Encounter | South Province (Area Five) | — | — | South Province | |
| 21 | Encounter | South Paldean Sea | — | — | South Province | |
| 22 | Boss | Iono (Electric Gym) | Gym | 24 | Levincia | |
| 23 | Encounter | Asado Desert | — | — | West Province | |
| 24 | Encounter | East Paldean Sea | — | — | East Province | |
| 25 | Encounter | East Province (Area Three) | — | — | East Province | |
| 26 | Boss | Mela (Fire Star) | Starfall | 27 | East Province (Area One) | |
| 27 | Encounter | West Province (Area Two) | — | — | West Province | |
| 28 | Boss | Kofu (Water Gym) | Gym | 30 | Cascarrafa | |
| 29 | Boss | Orthworm (Lurking Steel Titan) | Titan | 29 | East Province (Area Three) | |
| 30 | Encounter | Tagtree Thicket | — | — | East Province | |
| 31 | Encounter | West Province (Area Three) | — | — | West Province | |
| 32 | Boss | Atticus (Poison Star) | Starfall | 33 | Tagtree Thicket | |
| 33 | Encounter | West Paldean Sea | — | — | West Province | |
| 34 | Encounter | Dalizapa Passage | — | — | North Province | |
| 35 | Boss | Larry (Normal Gym) | Gym | 36 | Medali | |
| 36 | Boss | Nemona (Fourth Battle) | Rival | 37 | Medali | |
| 37 | Encounter | Glaseado Mountain | — | — | North Province | |
| 38 | Boss | Ryme (Ghost Gym) | Gym | 42 | Montenevera | |
| 39 | Encounter | South Province (Area Six) | — | — | South Province | |
| 40 | Encounter | Alfornada Cavern | — | — | South Province | |
| 41 | Boss | Great Tusk/Iron Treads (Quaking Earth Titan) | Titan | 45 | Asado Desert | |
| 42 | Boss | Nemona (Fifth Battle) | Rival | 43 | Alfornada | |
| 43 | Boss | Tulip (Psychic Gym) | Gym | 45 | Alfornada | |
| 44 | Encounter | North Paldean Sea | — | — | North Province | |
| 45 | Encounter | North Province (Area Three) | — | — | North Province | |
| 46 | Boss | Grusha (Ice Gym) | Gym | 48 | Glaseado Mountain | |
| 47 | Boss | Ortega (Fairy Star) | Starfall | 50 | North Province (Area One) | |
| 48 | Encounter | Socarrat Trail | — | — | North Province | |
| 49 | Encounter | North Province (Area One) | — | — | North Province | |
| 50 | Encounter | North Province (Area Two) | — | — | North Province | |
| 51 | Encounter | Casseroya Lake | — | — | North Province | |
| 52 | Boss | Eri (Fighting Star) | Starfall | 56 | North Province (Area Three) | |
| 53 | Boss | Dondozo (False Dragon Titan) | Titan | 56 | Casseroya Lake | |
| 54 | Boss | Rika (Elite Four) | Elite Four | 58 | Pokemon League | |
| 55 | Boss | Poppy (Elite Four) | Elite Four | 59 | Pokemon League | |
| 56 | Boss | Larry (Elite Four) | Elite Four | 60 | Pokemon League | |
| 57 | Boss | Hassel (Elite Four) | Elite Four | 61 | Pokemon League | |
| 58 | Boss | Geeta (Top Champion) | Elite Four | 62 | Pokemon League | |
| 59 | Boss | Nemona (Final Battle) | Rival | 66 | Mesagoza | |

