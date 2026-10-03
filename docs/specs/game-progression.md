# Game Progression Roadmap

This is a planning reference for the Paldea Nuzlocke tracker. It is not runtime data and must not be imported by the app. The active progression is declared in story order in `app/src/views/Game/progression/progression-items.ts`. Add a progression component there when its implementation is ready.

The canonical order interleaves encounters, bosses, and optional raid cards as they appear in the player's route. The table below mirrors the main story entries; optional raid placement is listed separately below.

## Current Runtime Order

1. Starter
2. Poco Path
3. Release Starter (optional, shown when the "Release starter" setting is on)
4. Inlet Grotto
5. South Province (Area One)
6. Nemona (Second Battle)
7. Tera Raid 1★ (optional, hidden when the "Tera raids" setting is "None"; only required for completion when the setting is "Single")
8. Pokemon League (Paldea)
9. South Province (Area Two)
10. Katy (Bug Gym)
11. South Province (Area Three)
12. Klawf (Stony Cliff Titan)
13. Brassius (Grass Gym)
14. South Province (Area Four)
15. Tera Raid 2★ (optional, hidden when the "Tera raids" setting is "None"; only required for completion when the setting is "Single")
16. West Province (Area One)
17. Bombirdier (Open Sky Titan)
18. Giacomo (Dark Star)

## Full Progression Order

Legend: **Boss type** — Rival / Gym / Titan / Starfall / Elite Four. "Implemented" marks entries registered in `PROGRESSION_ITEMS`.

| # | Kind | Name | Boss Type | Level Cap | Province / Location | Implemented |
| ---: | --- | --- | --- | ---: | --- | :---: |
| 1 | Starter | Starter | — | — | — | ✅ |
| 2 | Boss | Nemona (First Battle) | Rival | 5 | Cabo Poco | |
| 3 | Encounter | Poco Path | — | — | South Province | ✅ |
| 4 | Encounter | Inlet Grotto | — | — | South Province | ✅ |
| 5 | Encounter | South Province (Area One) | — | — | South Province | ✅ |
| 6 | Boss | Nemona (Second Battle) | Rival | 9 | South Province (Area One) | ✅ |
| 7 | Encounter | Pokemon League (Paldea) | — | — | South Province | ✅ |
| 8 | Encounter | South Province (Area Two) | — | — | South Province | ✅ |
| 9 | Boss | Katy (Bug Gym) | Gym | 15 | Cortondo | ✅ |
| 10 | Encounter | South Province (Area Three) | — | — | South Province | ✅ |
| 11 | Boss | Klawf (Stony Cliff Titan) | Titan | 16 | South Province (Area Three) | ✅ |
| 12 | Boss | Brassius (Grass Gym) | Gym | 17 | Artazon | ✅ |
| 13 | Encounter | South Province (Area Four) | — | — | South Province | ✅ |
| 14 | Encounter | West Province (Area One) | — | — | West Province | ✅ |
| 15 | Boss | Bombirdier (Open Sky Titan) | Titan | 20 | West Province (Area One) | ✅ |
| 16 | Boss | Giacomo (Dark Star) | Starfall | 21 | West Province (Area One) | ✅ |
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

## Tera Raids

Tera Raids are optional side content, not part of the main story route. The "Tera raids" game setting controls their behavior: `None` hides every raid card; `Single` shows one raid slot per star tier and counts it toward progression completion (the player must resolve it — Caught, Missed, or Eliminated — before the tracker considers it done); `Unlimited` shows the same cards but lets the player log any number of Pokemon per tier, and those cards never block completion since they have no natural endpoint.

Each raid card lets the player search out a den of the matching star rating in-game and record whichever Pokemon they find there — the app does not simulate the raid's own encounter table.

### Star rating reference (Bulbapedia)

Source: [Tera Raid Battle - Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Tera_Raid_Battle).

| Star rating | Level in battle | Level when caught | Available from |
| :---: | ---: | ---: | --- |
| ★ | 12 | 12 | Start of the game (80%), tapering off after 3 badges |
| ★★ | 20 | 20 | Start of the game (20%), most common between 3–6 badges |
| ★★★ | 35 | 35 | After 3 badges |
| ★★★★ | 45 | 45 | After 6 badges |
| ★★★★★ | 75 | 75 | After the ending credits |
| ★★★★★★ | 90 | 75 | After the Academy Ace Tournament and 10 4★/5★ raids (one per real-life day) |

### Runtime placement

Raid cards are placed at the intended point in the tracker route, independently of when a tier first becomes *available* in-game. The 2★ card follows South Province (Area Four), before West Province (Area One), as requested for the runtime card order.

| Star rating | Caught level | Placement |
| :---: | ---: | --- |
| ★ | 12 | After Nemona's Second Battle (cap 9), before Katy (cap 15) — implemented |
| ★★ | 20 | After South Province (Area Four), before West Province (Area One) — implemented |
| ★★★ | 35 | After cap 33 (Giacomo), before cap 36 (Larry) — not yet registered |
| ★★★★ | 45 | After a cap-45 point (Great Tusk/Iron Treads or Nemona's Fifth Battle), before cap 48 (Grusha) — not yet registered |
| ★★★★★ / ★★★★★★ | 75 | Deferred until the roadmap includes a postgame/Academy Ace Tournament progression point — not yet registered |

The 1★ and 2★ cards are registered in `PROGRESSION_ITEMS`. Later tiers reuse the same generic card/action model and are added once their surrounding runtime progression exists.

