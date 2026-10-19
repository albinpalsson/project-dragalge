# project-dragalge

This monorepo contains the Paldea Nuzlocke Guide, an app for playing Nuzlockes
in Pokémon Scarlet and Violet, and the libraries built to support it.

## The Paldea Nuzlocke Guide

A guide for Pokémon Scarlet and Violet Nuzlockes, with a suggested order for
encounters and boss battles and an encounter randomizer.

Try the app: TODO.

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
feedback through GitHub issues: TODO.

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

## Quick Start

```bash
# Install dependencies and build the workspace packages
npm install

# Start development server
npm run start

# Build for production
npm run build

# Run tests
npm run test
```

## Optional Analytics

Analytics is opt-in and asks at the first game creation or import. Without a saved
choice, no analytics events are emitted. Game names and save contents stay in the
browser; the event payloads contain only app views, game settings categories, and
progression labels.

The build accepts a public GA4 measurement ID through `GA4_MEASUREMENT_ID`, but the
GA4 transport is not enabled yet. Setting the variable only injects the ID into the
bundle; it does not load Google scripts or send network requests. Measurement IDs are
public identifiers, not secrets.

```powershell
$env:GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX'
npm run build --prefix paldea-nuzlocke-guide
```

## Development

Start the app with `npm run start`; build and test with `npm run build` and
`npm run test`. The packages are managed as npm workspaces. For the required
Node.js version and package-specific commands, see [AGENTS.md](AGENTS.md) and
the relevant package guidance.
