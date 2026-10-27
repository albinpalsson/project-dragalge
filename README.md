# project-dragalge

This monorepo contains the Paldea Nuzlocke Guide, an app for playing Nuzlockes
in Pokémon Scarlet and Violet, and the libraries built to support it.

## The Paldea Nuzlocke Guide

A guide for Pokémon Scarlet and Violet Nuzlockes, with a suggested order for
encounters and boss battles and an encounter randomizer.

Try the app: https://paldeanuzlocke.com.

### Why A Guide For Scarlet And Violet?

Visible wild Pokemon can make it harder to preserve the spirit of the
first-encounter rule, because you can often choose which Pokemon to approach.
The app's encounter randomizer lets you roll an eligible encounter and then
find it in the game. It offers several modes and practical filters, including
default exclusions for ocean encounters in early areas before swimming would
normally be available.

Paldea's open world also lets you explore areas and challenge bosses out of
order, while their levels remain fixed. The guide provides a playtested order
for encounters and battles, intended to keep encounter levels close to your
team's progression, spread out new catches, and reduce grinding and route
research while playing.

### Additional Features

- Encounter details, including spawn times, terrain, sub-areas, and level ranges.
- Boss team information and displayed level caps.
- Encounter outcome tracking and party and box management.
- Configurable randomizer modes, duplicate-species options, and ban lists.
- Tera Raid settings for no encounters, one per supported star rating, or
  unlimited encounters.
- Optional helpful tips and information about strong trainers.
- Multiple saved runs, with support for sharing and importing runs.
- Browser-based storage without an account or automatic cross-device sync.

### Feedback

The app is actively maintained. Report mistakes, suggest improvements, or share
feedback through GitHub issues: [project-dragalge issues](https://github.com/albinpalsson/project-dragalge/issues/new).

The libraries are separate projects with small, familiar interfaces. Their core
features are implemented here rather than built on third-party runtime
libraries. This makes them useful on their own and gives the app clear points
where a more complete library can replace them later. Some interfaces follow
ecosystem standards; others use familiar patterns but have their own APIs.

## Projects

- [Paldea Nuzlocke Guide](paldea-nuzlocke-guide/) — guides players through
  Scarlet and Violet Nuzlocke runs.
- [Bundler](bundler/README.md) — bundles the app and runs a development server.
- [CSS-in-JS](css-in-js/README.md) — extracts static CSS during the build.
- [Database](db/README.md) — runs a small SQL subset over in-memory data.
- [Query Builder](query-builder/README.md) — builds typed, parameterized SQL.
- [Pokémon Data](pokemon-data/README.md) — provides Pokémon data as an embedded
  SQL database.
- [Server Query](server-query/README.md) — tracks query and mutation state.
- [Validator](validator/README.md) — validates values with composable schemas.

## Near-Zero Dependencies

This project explores how far a modern web app can go with almost no
third-party code. The bundler, CSS-in-JS extraction, SQL database, query
builder, server-state tracking, and validator are all written in this
repository instead of pulled from npm. The only libraries involved are listed
here.

### Runtime

Shipped to the browser in the production bundle:

- [`react`](https://www.npmjs.com/package/react) and
  [`react-dom`](https://www.npmjs.com/package/react-dom) — UI rendering.

### Bundle And Build

Used while building the app, but not shipped:

- [`typescript`](https://www.npmjs.com/package/typescript) — transpiles source
  for the custom bundler and type-checks the packages.

### Dev Tools

Used for development, testing, and type definitions only:

- [`@biomejs/biome`](https://www.npmjs.com/package/@biomejs/biome) — linting and
  formatting.
- [`@playwright/test`](https://www.npmjs.com/package/@playwright/test) —
  end-to-end tests.

## Development

Start the app with `npm run start`; build and test with `npm run build` and
`npm run test`. The packages are managed as npm workspaces. For the required
Node.js version and package-specific commands, see [AGENTS.md](AGENTS.md) and
the relevant package guidance.
