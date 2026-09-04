# Application Architecture Specification

## Research & Context

### Purpose
This spec defines the overall structure of the Paldea Nuzlocke tracker app, integrating all custom core modules and defining the component hierarchy, data flow, and user interactions.

### Architecture Principles
1. **Data-Centric**: All state flows through query builder + localStorage based DB
2. **Offline-First**: App works completely offline; localStorage for persistence
3. **Unidirectional Data Flow**: Views → Query (state management) → DB → Query (state management) → Views
4. **Composable Components**: Build UI from small, focused components
5. **CSS Encapsulation**: Each component owns its styles via css-in-js


## Requirements (In-Scope)

### Core Views

Three top-level pages:
1. **Home Screen**: List of all started game runs, each shown as a progress card (caught Pokémon icons + completion %); start new run, load/select a run, delete a run
2. **Main Player Page**: For the active game run — a single combined vertical list of Locations and Boss Battles, ordered by game progression
3. **About**: Static page explaining why the app exists and what it solves

### Overlay Views

True floating popups, implemented purely with CSS positioning (`position: fixed`/`absolute` + z-index stacking) over the underlying page — no portal/modal library, no separate DOM root:
- **Settings**: Configure the active game run (level cap, reset run, export/import data)
- **Pokémon Stat**: Hover/press popup on a Pokémon icon (a boss roster Pokémon or an entry in the caught list) — shows battle stats; the caught-list variant also shows evolution data and allows a level-up interaction

### Expandable Sections

Not overlays — plain inline expand/collapse rows within the Main Player Page's combined list (pushes surrounding content down, no floating/positioning):
- **Location**: Expanding a location row reveals all possible encounters there with info, and allows manually marking a Pokémon as caught
- **Boss Battle**: Expanding a boss battle row reveals its full Pokémon roster with moves and abilities

### Legal Attribution (When Using Bulbapedia-Derived Seed Data)
- The app must expose a visible legal notice in Settings/About linking to:
  - Bulbapedia source page(s)
  - Bulbapedia copyright/license page
  - CC BY-NC-SA 2.5 license text
- The legal notice must state that Bulbapedia-derived data is used under
  CC BY-NC-SA 2.5 and is non-commercial/share-alike.
- This requirement applies even when data is bundled inline in app assets.
- TODO, POKEMONDB sprites also has legal attribution constraints for us


### Key Features

1. **Offline Persistence**
   - All data stored locally in DB + localStorage
   - No server needed
   - Export/import backup as JSON

2. **Mobile Responsive**
   - Touch-friendly UI (large tap targets)
   - Responsive layout (flex-based)
   - Works on 320px (phone) to desktop widths


---

## Out of Scope (V1)

- Multi-user sync / cloud backup
- Social features (share runs, leaderboards)
- Advanced analytics (win rates, time tracking)
- Custom Pokédex filtering (start with basic search)
- Team building optimizer / suggestions
- Move tracking (track learned moves)
- Item management (simplified inventory)
- Pokémon breeding (not in Nuzlocke scope)
- Photo mode / screenshots

---

## Design & Architecture
....

### Router (In-Memory State-Based)

No URL or browser history integration. A single `activeView` value is held in React state at the app root and passed down (via props or context). Navigation is just calling the setter — there is no back/forward support.

The active view is a discriminated union covering only the three top-level pages:

```ts
type ActiveView =
    | { view: 'home' }
    | { view: 'game'; gameRunId: string }
    | { view: 'about' };
```

Overlays and expandable sections are **not** part of the router — they're local component state (e.g. `isOpen`, or the id of what's expanded/popped-open) held near where they're rendered, since they never replace the underlying page.


### Styling Strategy

1. **Global Styles**: Base HTML resets, typography, layout foundations (plain CSS)
2. **Component Styles**: All component styles via `css()` function (scoped class names)
3. **Colors/Theme**: CSS variables or constants (define once, use everywhere)
4. **Responsive**: Mobile-first approach, media queries for breakpoints

### File Layout Convention

In every view/component `.tsx` file, the exported component function comes first (after imports and any prop-type declarations it needs), with `css()` style constants and other non-component helper functions defined below it. This keeps the JSX/behavior the first thing a reader sees, since `function` declarations are hoisted, module-level `const`s below the component are still fully initialized by the time React renders it.

### Database Schema

The app uses **two separate `DB` instances** (`@pokedb2/db`), each wrapped in `createDb<T>()` (`@pokedb2/query-builder`) for typed querying:

1. **Pokémon Data DB (read-only)** — the compiled seed artifact from `pokemon-data` (`pokemon-data/artifacts/paldea-db.js`, a base64-encoded blob) is loaded via `decodeBlob` (`db/src/persistence.ts`) into a `DB` constructed with no writable `StoragePlugin`; the app never writes to it. Typed via `PokemonDataDb` (`pokemon-data/src/schema.ts`): `pokemon`, `pokemon_types`, `locations`, `sub_areas`, `terrain_types`, `evolution_methods`, `evolution_transitions`, `abilities`, `boss_battles`, `boss_battle_pokemon`, `moves`, `boss_battle_pokemon_moves`, plus one encounter table per location.
2. **App/Game DB (read-write, localStorage-persisted)** — a new `DB` backed by a new `LocalStoragePlugin` implementing `StoragePlugin.read()/write()` (`db/src/types.ts`) against `window.localStorage`, mirroring the `FileStoragePlugin` pattern used by `pokemon-data`'s `logging-db-client.ts`. Owns app-only run-state tables:
   - `game_runs`: id, name, started_at, level_cap
   - `caught_pokemon`: id, game_run_id, pokemon_id, location_id, level, caught_at
   - `party`: id, game_run_id, caught_pokemon_id, slot
   - `boss_battle_progress`: game_run_id, boss_battle_id, defeated_at
   - `tera_raid_log`: id, game_run_id, pokemon_id, completed_at
   - `settings`: game_run_id, key, value

The app DB additionally flows through `@pokedb2/server-query`'s `QueryClient`/`useQuery`/`useMutation` to sync with React state; the Pokémon Data DB is queried directly since it never changes.

**Schema versioning**: the app DB's `LocalStoragePlugin` stores its blob under a version-suffixed key (`pokedb2:game-db:v{N}`, `N` from `GAME_DB_SCHEMA_VERSION` in `app/src/db/game-db/schema.ts`). Bump `GAME_DB_SCHEMA_VERSION` whenever the DDL changes. A mismatched/missing version key is treated as no existing data and the schema is (re)initialized fresh — old versioned keys are left in place rather than deleted, so a future migration step can read them explicitly by name instead of trying to decode incompatible data under the current schema.

### Progression Timeline

The ordered Game view timeline is application-specific, not general Pokémon data. It lives in `app/src/views/Game/progression.ts` as a typed hardcoded manifest of starter, encounter-location, and boss-fight entries. The manifest decides when the tracker presents each location or boss; the Pokémon Data DB only supplies the detailed facts for a rendered entry, such as encounter rows, Pokémon names, terrain, sub-areas, boss rosters, moves, and abilities.

### Data Access Layer

Structured to look like a full-stack app with a real backend, easing a future migration off in-browser DBs:

1. **`db/` calls directory** — one subdirectory per database (e.g. `src/db/pokemon-data/`, `src/db/game-db/`), each exposing plain async functions that wrap `@pokedb2/query-builder` calls, e.g. `listPokemonForLocation(locationId)`, `getCaughtPokemon(gameRunId)`, `addCaughtPokemon(input)`. These functions are the only code that touches `selectFrom`/`insertInto`/etc. directly — everything else calls through them, as if they were server endpoints.
2. **Co-located `queries.ts` files** — next to the view/component that needs them, containing `useQuery`/`useMutation` wrappers (`@pokedb2/server-query` via `app/src/server-query.tsx`) whose `queryFn`/`mutationFn` just calls into a `db/` function, e.g.:

```ts
// views/Location/queries.ts
export function useLocationEncounters(locationId: string) {
    return useQuery({
        queryKey: ['location-encounters', locationId],
        queryFn: () => listPokemonForLocation(locationId),
    });
}
```

Components only ever import from their local `queries.ts`, never call `db/` functions or the query builder directly.

### Pokémon Icons

- Icon sprites come from `pokemon-data/artifacts/assets/*.avif` (one file per Pokémon slug, e.g. `pikachu.avif`), fetched/licensed per `pokemon-data/POKEMONDB_SPRITES_NOTICE.md` (an `ATTRIBUTION.txt` ships alongside the images).
- Rendered everywhere as plain `<img src="..." loading="lazy" />` — no image/sprite component library.
- The bundler only auto-copies a `public/` directory that sits next to the entry file (`copyPublicAssetsToOutput` in `bundler/src/utils/asset-copy.ts` copies `app/public/**` → `dist/`); it does **not** reach into other packages. So `pokemon-data/artifacts/assets` must be synced into a new `app/public/assets/` directory (a copy step, e.g. run alongside `pokemon-data`'s build or as an app prebuild step) before the icons are available to the bundler. Icons are then referenced as `/assets/{slug}.avif`.
- A small helper, e.g. `pokemonIconSrc(slug: string) => \`/assets/${slug}.avif\``, should be the single place constructing icon paths.

### Testing Strategy

- Deliberately small: a handful of full integration/user-flow tests in a real browser via Playwright — no component/unit test sprawl for the app package.
- `playwright.config.ts` uses `webServer` (`command: 'npm run dev --prefix app'`, pointed at the bundler's `DevServer`) so the ~1-2s build happens **once for the whole run**, before any workers start; parallel test files/workers all hit that one already-running server.
- Covers the User Flows below (first-time user, active run, progress tracking, export) end-to-end rather than isolated units.

## Verification

### Functional Requirements
- [ ] Start new run: Create game run, initialize DB
- [ ] Add Pokémon to party: SELECT from caught, INSERT into party
- [ ] Encounter new Pokémon: Log in caught table, prevent duplicates (one per location)
- [ ] Level cap setting: Update store, persist to localStorage
- [ ] Boss battle tracking: Mark defeated, save date
- [ ] Tera raid tracking: Log encounter, mark complete
- [ ] Export run data: Generate JSON snapshot
- [ ] Import run data: Load from JSON, restore DB state
- [ ] Mobile responsiveness: Test on 320px, 768px, 1024px, 1440px
- [ ] Offline mode: Disable network, verify app works
- [ ] Legal notice visible from Settings/About with required attribution and license links

### User Flows
1. **First-time user**: Home → Choose starter → Party view
2. **Active run**: Party → Location → Encounter → Add to caught → Back to party
3. **Progress tracking**: Party → Boss battles → Level cap → Settings
4. **Export**: Settings → Export → Download JSON

---

## TODOs
