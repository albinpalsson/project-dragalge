# App Instructions

Read these instructions for changes under `paldea-nuzlocke-guide/`. The app is an offline-first
React application; keep persistence and data access behind the existing package
boundaries.

## Architecture and Data Access

- `src/router.ts` defines the `ActiveView` union. Top-level navigation is held
  in app state and synchronized with browser history; overlays and expandable
  content remain local component state.
- Keep the Pokémon data DB read-only and separate from the writable game DB.
  Put database operations in their owning `src/db/pokemon-data/` or
  `src/db/game-db/` module; do not issue query-builder operations from views or
  components. A database-specific module should not silently combine both DBs.
- Backend-shaped DB functions return serializable domain data. Prefer stable
  names/keys to storage IDs when callers do not need the IDs. Make cross-DB
  composition explicit at the frontend or at a deliberate service boundary.
- Put each query call behind its own named query hook in the relevant
  `queries.ts` or `src/hooks/` module. Do not call raw `useQuery` inside a
  component or another hook. Keep query keys consistent with the data shape
  they cache; mutations should invalidate the resources they change.
- Keep mutations behind named mutation hooks and domain actions. `GameProvider`
  receives ready game data and exposes it through `useGame()`; it is not a
  query owner. Encounter lifecycle actions and party/box transitions belong
  to the existing action/manager hooks, not individual UI components.
- The runtime progression order is owned by
  `src/views/Game/progression/progression-items.ts`. Keep exceptional
  progression behavior in direct components under that directory rather than
  introducing generic registries or configuration layers without a clear need.

## Persisted Game Data

- `src/db/game-db/schema.ts` owns the game DB schema and
  `GAME_DB_SCHEMA_VERSION`. Bump the version when the schema or persisted data
  contract changes. A mismatched version starts a fresh schema; this is not an
  automatic migration system.
- The localStorage-backed game DB uses a single-writer guard. A second tab can
  make an older tab unable to save; do not imply that tabs merge or transact
  changes with one another.
- Encounter rows distinguish persisted lifecycle states from frontend-only
  display states. Keep `notRolled` frontend-only; do not conflate a rolled
  `pending` encounter with query loading. A skipped encounter is resolved but
  is not a caught Pokémon or a party/box member. Preserve `rolled_as` as the
  original encounter identity when the current Pokémon name later changes.
- Keep app-owned randomizer and form-selection behavior in `src/randomizer.ts`
  and `src/pokemon-species.ts`; keep presentation and data access separate.

## UI and Styling

- Global tokens and theme values live in `src/index.css`. Component styles use
  `css()` from `@project-dragalge/css-in-js`; use the existing tokens instead of
  hardcoding component colors.
- Keep component-specific styles and markup with the component. In TSX files,
  retain the local convention of declaring the exported component before its
  style constants and helpers.
- Reuse existing primitives such as `ProgressionCard`, `StatusChip`, and
  `OverflowMenu`; preserve their keyboard and dismissal behavior. Tables use
  the established alternate-row surface token. Use emoji only where they
  clarify a primary action or toggle.
- Keep responsive behavior and accessible button-based alternatives when
  adding interactions such as drag-and-drop.

## Notices and Assets

- Keep the Licenses & Notices page and Home attribution link visible. Full
  notices are app-owned static files under `public/notices/` and must ship in
  production output.
- Scope Bulbapedia licensing statements to material confirmed to be covered;
  source pages and revisions can have different terms. Keep sprite attribution
  and rights notes distinct from Bulbapedia data licensing.
- Use the existing Pokémon icon helper and asset-sync flow rather than
  constructing asset paths ad hoc. The bundler copies the app's `public/`
  assets, not files directly from another workspace package.

## Tests and Commands

App behavior is primarily covered by focused Playwright user flows. Extend the
existing canonical progression tests and focused regression tests where they
cover the behavior; do not remove supporting coverage just because a canonical
run exercises a related path. Shared browser helpers live in `tests/helpers.ts`.
Game DB writes are debounced, so call `waitForPersistence()` before reloading
when a test needs to observe saved state.

`playwright.config.ts` starts `npm run playwright-dev` on a dynamic port with
watching disabled for tests. Use these commands from the repository root:

```powershell
npm run build --prefix paldea-nuzlocke-guide
npm run test --prefix paldea-nuzlocke-guide
npm run lint --prefix paldea-nuzlocke-guide
```

The app build does not type-check; `npm run lint --prefix paldea-nuzlocke-guide` runs TypeScript.
Run root `npm run lint` for the workspace Biome check as described in the root
instructions.