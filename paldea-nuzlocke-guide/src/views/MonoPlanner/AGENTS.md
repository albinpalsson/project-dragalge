# Mono Type Planner

An experimental page that estimates how hard a mono-type run is, boss by
boss. It is deliberately kept apart from the rest of the app, both in the UI
(its own menu entry, with disclaimers about accuracy) and in the code, so it
can be changed freely or removed in one go. Its accuracy bar is lower than the
rest of the app.

## Isolation

- Everything the planner needs lives in this folder, plus its database module
  `src/db/pokemon-data/mono-planner.ts`.
- Shared code may be imported as it already is. Do not add planner-only
  exports, types, hooks, query keys or props to shared modules; extend or
  duplicate locally instead. Change shared code only for a fix that makes sense
  for the whole app, and keep it in its own commit.
- Data access follows the app's client/server border: direct database queries
  go in `db/pokemon-data/mono-planner.ts`, and their query hooks and keys in
  `queries.ts` here.
- The folder is one lazy chunk, loaded by the single `import()` in
  `views/App.tsx`. Never import from this folder statically elsewhere, and only
  import `db/pokemon-data/mono-planner.ts` from here, so it stays in the chunk.

## Model

`calculate-mono-plan.ts` walks the progression and describes the model in its
top comment; `plan-locations.ts` handles encounters and `plan-bosses.ts` boss
scoring. Assumptions that are not game data live in `boss-config.ts`,
`evolution-assumptions.ts` and `milestone-config.ts`. Prefer simple rules over
edge-case handling.

Alolan and Hisuian forms stay in the shared Pokémon DB because saved games may
reference them. The planner removes them from its own data in
`other-regions.ts` before calculating.

## Tests

`mono-planner.spec.ts` holds one or two Playwright user-flow tests for common
use. Do not add small tests for special cases. It runs with the app's
`npm run test`.

## Removing the Feature

1. Delete this folder and `src/db/pokemon-data/mono-planner.ts`.
2. Remove `'monoPlanner'` from `src/router.ts`, `src/hooks/useViewNavigation.ts`,
   `src/view-hash.ts` and `src/views/App.tsx` (the lazy import, the `MenuLink`
   and the render), and its mention in the chunk comment there.
3. Remove the planner entry from `testMatch` in `playwright.config.ts`.
4. Remove the link to this file from `paldea-nuzlocke-guide/AGENTS.md`.
