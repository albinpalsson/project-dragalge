# project-dragalge

This monorepo contains the [Paldea Nuzlocke Guide](paldea-nuzlocke-guide/README.md),
an app for playing Nuzlockes in Pokémon Scarlet and Violet, and the small
libraries it is built on.

Try the app: https://paldeanuzlocke.com.

## The Idea

The website's purpose and scope are well defined and simple, so I wanted to
explore using as few open source dependencies as possible.

Instead, the repository has its own internal packages with very limited
features. They mirror or imitate the interfaces of popular libraries, which
keeps our code simple while leaving the door open to migrating to the real
thing in the future. Some interfaces follow
ecosystem standards; others use familiar patterns but have their own APIs.

The main decisions that have kept it simple:

- React, run on [TanStack Redact](https://www.npmjs.com/package/@tanstack/redact),
  is used as the only runtime dependency.
- The build tools avoid a full AST, dead-code elimination and minification.

### The Result

- **A perfect Lighthouse score.** The app scores 100 on mobile in performance,
  accessibility, best practices and SEO.
- **A fast bundler.** Measured on a Windows dev machine with Node 26:

  | | Time |
  |---|---|
  | Cold production build | ~1.7 s |
  | Dev server start | ~1.2 s (2.8 s with a cold cache) |
  | Dev server rebuild after an edit | ~0.6 s |

- **Ecosystem integration.** Linting, VS Code plugins and AI agents all work
  with the project as expected, since it builds on common, well-known
  cornerstones: TypeScript, React's interfaces, SQL and npm workspaces.

## Projects

- [Paldea Nuzlocke Guide](paldea-nuzlocke-guide/README.md) — guides players
  through Scarlet and Violet Nuzlocke runs.
- [Bundler](bundler/README.md) — bundles the app and runs a development server.
- [CSS-in-JS](css-in-js/README.md) — extracts static CSS during the build.
- [Database](db/README.md) — runs a small SQL subset over in-memory data.
- [Query Builder](query-builder/README.md) — builds typed, parameterized SQL.
- [Pokémon Data](pokemon-data/README.md) — provides Pokémon data as an embedded
  SQL database.
- [Redact Plugin](redact-plugin/README.md) — runs the app on TanStack Redact
  through the bundler's transforms.
- [Server Query](server-query/README.md) — tracks query and mutation state.
- [Validator](validator/README.md) — validates values with composable schemas.

## Dependencies

### Runtime

Shipped to the browser in the production bundle:

- [`@tanstack/redact`](https://www.npmjs.com/package/@tanstack/redact) — UI
  rendering, in place of React.

### Build

Used while building the app, but not shipped:

- [Node.js](https://nodejs.org/) — runs the bundler, the dev server and the
  package scripts. Its built-in modules handle file system work, Brotli
  compression, content hashing and the dev server's HTTP.
- [`typescript`](https://www.npmjs.com/package/typescript) — transpiles source
  for the custom bundler and type-checks the packages.

### Dev Tools

Used for development, testing, and type definitions only:

- [Node.js](https://nodejs.org/) — runs the package tests with its built-in
  test runner (`node --test`).
- [`@biomejs/biome`](https://www.npmjs.com/package/@biomejs/biome) — linting and
  formatting.
- [`@playwright/test`](https://www.npmjs.com/package/@playwright/test) —
  end-to-end tests.

## Development

Start the app with `npm run start`; build and test with `npm run build` and
`npm run test`. The packages are managed as npm workspaces. For the required
Node.js version and package-specific commands, see [AGENTS.md](AGENTS.md) and
the relevant package guidance.
