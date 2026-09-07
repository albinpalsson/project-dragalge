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
   - `game_runs`: id, variant, randomizer_mode
   - `encounter_rolls`: game_run_id, location_id, pokemon_id, status
   - `party`: id, game_run_id, caught_pokemon_id, slot
   - `boss_battle_progress`: game_run_id, boss_battle_id, defeated_at
   - `tera_raid_log`: id, game_run_id, pokemon_id, completed_at
   - `settings`: game_run_id, key, value

Only `game_runs` and `encounter_rolls` exist today; the rest are planned. One `encounter_rolls` row exists per location as soon as an encounter is rolled or picked, and its `status` is `pending`, `caught`, `missed`, or `eliminated`. The DB has no NULL type, so `pending` is stored as an explicit string rather than an empty value. Clearing a roll deletes the row, which is what re-enables rolling for that location.

Both DBs flow through the data access boundary below. The App/Game DB additionally uses `@pokedb2/server-query`'s `QueryClient`/`useQuery`/`useMutation` for React cache sync and mutation invalidation. The Pokémon Data DB is read-only, but components still access it through backend-shaped query functions and frontend hooks rather than direct query-builder calls.

**Schema versioning**: the app DB's `LocalStoragePlugin` stores its blob under a version-suffixed key (`pokedb2:game-db:v{N}`, `N` from `GAME_DB_SCHEMA_VERSION` in `app/src/db/game-db/schema.ts`). Bump `GAME_DB_SCHEMA_VERSION` whenever the DDL changes. A mismatched/missing version key is treated as no existing data and the schema is (re)initialized fresh — old versioned keys are left in place rather than deleted, so a future migration step can read them explicitly by name instead of trying to decode incompatible data under the current schema.

### Progression Timeline

The ordered Game view timeline is application-specific, not general Pokémon data. The active runtime order is declared directly in `app/src/views/Game/Game.tsx` as readable JSX. A progression point becomes visible when its direct component is added there in story order. The full future roadmap is retained in `docs/specs/game-progression.md` for reference only and must not be imported by runtime code.

`Game` owns the selected-game queries and their loading, error, and not-found states. Only after the game run and encounter rolls are valid does it render the successful progression subtree inside `GameProvider`. `GameProvider` is a context injector, not a query owner: it receives complete game data, memoizes the context value with `useMemo`, and exposes it through `useGame()`. Consumers use `useGame()` to access the selected run id, settings, randomizer mode, and encounter rolls without passing those values through every card. No fallback settings, empty placeholder arrays, or undefined run metadata are exposed through context.

Progression-specific behavior belongs in direct function components under `app/src/views/Game/progression/`, such as `progression/encounters/PocoPath.tsx`. These components own their exceptional controls, filtering, warnings, loading/error returns, and card layout. Avoid configuration objects, generic card registries, and generic extension props such as `extraControls` when direct JSX keeps the behavior easier to understand.

Reusable encounter behavior is intentionally split into small boundaries. Components use `useLocationEncountersQuery()` directly when no additional behavior is needed; one-to-one forwarding hooks are not added. Focused hooks in `app/src/hooks/` separately handle the selected roll, roll/status actions, and starter actions. Shared encounter formatting functions live in a focused utility module rather than being copied into table/result components. Small visual components in `app/src/components/` handle structures such as `EncounterHeader`, `Checkbox`, `RollResult`, `RollActions`, `EncounterTableToggle`, `EncounterTable`, and `EncounterRandomizer`. These components should primarily own their HTML/CSS and render narrow props; `RollActions` is the small behavior-aware exception that reads the current game and binds roll/status actions internally. `StarterCard`, `PocoPath`, and `InletGrotto` remain direct progression components with their own local rules. Duplication is acceptable when extracting more behavior would hide a card's rules behind an abstraction. Future boss components should follow the same direct-component pattern.

Encounter randomization is likewise app-owned. `app/src/randomizer.ts` is a pure module with an injectable random source, and every mode groups candidates before rolling so a species counts once regardless of how many sub-areas or forms it appears in. The mode is chosen when starting a run and stored on `game_runs`.

`app/src/randomizer-groups.ts` holds the explicit merge list backing that grouping. It is required rather than cosmetic: the seed data spells several variants two ways (`Basculin (Red-Striped)` and `Basculin Red`), so they exist as separate `pokemon` rows that must still count as one roll. It is scoped to randomizer merges only — icon/display resolution for those same names (e.g. sprite slugs for `Flabébé` or any parenthesized form) is a separate concern with its own naive fallback for now, and may not end up grouping names identically.

### Data Access Layer

Structured to look like a full-stack app with a real backend, easing a future migration off in-browser DBs. Even while both databases run in the browser, code should assume a backend query may later become an API call backed by a DB lookup, and that the two databases may live in different places.

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

#### Backend Query Contract

Backend query functions in `app/src/db/**` are endpoint-shaped functions. They should expose cohesive API resources, not raw implementation details and not React-specific view models:

- A backend query function should make sense as a standalone API operation. It may do several DB reads when those reads naturally produce one resource, such as location encounter details or a boss battle roster.
- A backend query function in a database-specific directory is a **single database** operation: `app/src/db/pokemon-data/**` may only touch the Pokémon Data DB; `app/src/db/game-db/**` may only touch the App/Game DB. If the app later needs an endpoint that combines data owned by multiple services, model that as an explicit API/service composition boundary rather than hiding it in one DB directory.
- A backend query function returns data that is trivial to serialize across an API boundary: primitives, arrays, and plain records. Do not return `Map`, `Set`, class instances, functions, DB handles, query-builder objects, React state, or React cache objects.
- A backend query function should expose stable domain concepts rather than leaking storage shape. Prefer public identifiers such as Pokémon names, canonical species/group keys, route/location keys, battle keys, or run ids over Pokémon Data DB implementation ids when those ids are only needed to join internal tables.
- Mutation functions should return the affected serializable row or DTO and leave cache invalidation to frontend hooks.

Good backend-shaped examples:

```ts
export async function listEncounterRolls(gameRunId: string): Promise<EncounterRollRow[]> {
  return (await getGameDb())
    .selectFrom('encounter_rolls')
    .selectAll()
    .where('game_run_id', '=', gameRunId)
    .execute();
}

export async function getPokemonSummary(name: string): Promise<PokemonSummary | undefined> {
  const row = await (await getPokemonDb())
    .selectFrom('pokemon')
    .selectAll()
    .where('name', '=', name)
    .executeTakeFirst();

  return row
    ? {
        name: row.name,
        baseStats: {
          hp: row.base_hp,
          attack: row.base_attack,
          defense: row.base_defense,
          specialAttack: row.base_sp_attack,
          specialDefense: row.base_sp_defense,
          speed: row.base_speed,
        },
      }
    : undefined;
}
```

#### Public Identifiers and DTOs

The frontend should usually talk in domain identifiers, not Pokémon Data DB primary keys. Numeric ids and join-table ids are storage details unless the product itself needs to display or persist them.

Preferred API inputs and outputs:

- Query Pokémon data by canonical Pokémon name, species/group key, or another stable public key. Keep internal `pokemon.id` values inside Pokémon Data DB query functions where possible.
- Query encounter data by route/location key or location name, not by internal encounter-table ids.
- Return DTOs shaped for the API contract, such as `PokemonSummary`, `LocationEncounterDetails`, or `BossBattleRoster`, rather than exposing full DB rows by default.
- Include internal ids only when the frontend must send them back to app-owned state, when the id is already a stable public identifier, or when there is no clearer domain key yet. Treat that as an explicit API decision.

For example, a location encounter endpoint can query the location row, encounter table, Pokémon rows, sub-areas, and terrain types internally, then return a serializable DTO with Pokémon names, display names, icon slugs, sub-area names, terrain labels, games, and level/rate fields. The frontend should not need the underlying Pokémon ids, sub-area ids, or terrain ids just to render the encounter list.

#### Frontend Query Granularity and Cacheability

Frontend `queries.ts` files should cache API-shaped resources with precise `queryKey`s. The goal is not to cache every tiny DB lookup independently; the goal is to cache useful API resources at the boundary where the frontend and backend would naturally communicate.

Examples of sensible cacheable resources:

- `['games']` for game-run summaries.
- `['encounter-rolls', gameRunId]` for app-owned encounter progress in one run.
- `['pokemon-summary', pokemonName]` for one reusable Pokémon summary.
- `['location-encounter-details', locationKey]` for a complete location encounter DTO.
- `['game-cards']` may be reasonable if the backend/API contract intentionally exposes a home-screen summary owned by one service boundary.

Do not split every query mechanically. A backend query may return a purpose-built serializable DTO when the data is naturally one resource, the API boundary is clear, and callers benefit from a stable contract. Split only when separate resources are independently reusable, independently invalidated, or owned by different backend/data boundaries.

#### Two-Database Composition

The Pokémon Data DB and App/Game DB should not be casually joined inside one database-specific backend query function. They may later live in separate places, such as Pokémon data on a backend service and game-run data in local app storage, or vice versa.

When a UI needs data from both databases, prefer one of these explicit boundaries:

- Compose separate cacheable API resources in frontend hooks when the data belongs to separate services or cache lifetimes.
- Add a deliberate API/service composition function if the product needs one cohesive resource and that composition boundary would still make sense after moving databases out of the browser.

Frontend composition example:

```ts
export function useGameCards() {
  const gamesQuery = useGames();
  const caughtQueries = useCaughtPokemonForGames(gamesQuery.data ?? []);
  const pokemonByNameQuery = usePokemonSummaryByNameMap(
    collectPokemonNames(caughtQueries.data ?? []),
  );

  return buildGameCards(
    gamesQuery.data ?? [],
    caughtQueries.data ?? [],
    pokemonByNameQuery.data ?? new Map(),
  );
}
```

The exact hook shape may vary with the capabilities of `@pokedb2/server-query`. The important rule is that any cross-database composition must be visible in the architecture, not hidden in `pokemon-data` or `game-db` query modules.

#### Serializable Backend Results, Rich Frontend Hooks

Frontend hooks and component-local helpers are the right place for non-serializable ergonomics and view-specific enrichment.

For example, keep the backend result plain:

```ts
export async function getPokemonSummary(name: string) {
  return pokemonSummary;
}
```

Then build richer lookup structures in a frontend hook:

```ts
export function usePokemonSummaryByNameMap(names: readonly string[]) {
  const normalizedNames = normalizePokemonNames(names);
  const query = useQuery({
    queryKey: ['pokemon-summaries', normalizedNames],
    queryFn: () => listPokemonSummaries(normalizedNames),
  });

  return {
    ...query,
    data: query.data
      ? new Map(query.data.map((pokemon) => [pokemon.name, pokemon]))
      : undefined,
  };
}
```

Likewise, a location encounter backend query may return a complete serializable `LocationEncounterDetails` DTO if that is the API resource the frontend needs. The DTO should contain public/domain fields, not lookup-table ids that only exist to join Pokémon Data DB tables.

#### Current Refactor Targets

The current codebase has a few places that predate this stricter boundary and should be refactored before a backend split:

- `app/src/views/Home/queries.ts` `useGameCards()` currently combines game-db reads with Pokémon Data DB reads inside one broad frontend query. Revisit whether the Home screen should use explicit frontend composition from separate resources, or a deliberate API/service composition resource such as `listGameCardSummaries()`.
- `app/src/db/pokemon-data/queries.ts` `getLocationEncounterDetails()` currently returns a serializable API-shaped DTO, which is a reasonable direction. It should be adjusted over time so frontend callers rely on Pokémon names/group keys/display fields rather than internal Pokémon ids when possible.
- Mutation hooks such as `useCreateGame()` and `useCatchPokemonMutation()` should invalidate the API resources they change or make stale, such as `['games']`, `['encounter-rolls', gameRunId]`, or a documented composed summary key.

### Pokémon Icons

- Icon sprites come from `pokemon-data/artifacts/assets/*.avif` (one file per Pokémon slug, e.g. `pikachu.avif`), fetched/licensed per `pokemon-data/POKEMONDB_SPRITES_NOTICE.md` (an `ATTRIBUTION.txt` ships alongside the images).
- Rendered everywhere as plain `<img src="..." loading="lazy" />` — no image/sprite component library.
- The bundler only auto-copies a `public/` directory that sits next to the entry file (`copyPublicAssetsToOutput` in `bundler/src/utils/asset-copy.ts` copies `app/public/**` → `dist/`); it does **not** reach into other packages. So `pokemon-data/artifacts/assets` must be synced into a new `app/public/assets/` directory (a copy step, e.g. run alongside `pokemon-data`'s build or as an app prebuild step) before the icons are available to the bundler. Icons are then referenced as `/assets/{slug}.avif`.
- A small helper, e.g. `pokemonIconSrc(slug: string) => \`/assets/${slug}.avif\``, should be the single place constructing icon paths.

### Testing Strategy

- Deliberately small: a handful of full integration/user-flow tests in a real browser via Playwright — no component/unit test sprawl for the app package.
- One test plays the game the intended way, from starting a run toward full progress, and grows as each progression card lands. Everything else is a short, focused feature test (home cards, re-roll gating, modal dismissal, header navigation). Prefer extending the playthrough over adding a new spec.
- Shared step helpers live in `app/tests/helpers.ts`. Because the game DB write is debounced, any assertion that survives a reload must first wait for the `pokedb2:game-db:` localStorage value to change.
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
