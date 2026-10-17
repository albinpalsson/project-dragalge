// README for Project Structure

# Paldea Nuzlocke Tracker - Project Structure

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run start

# Build for production
npm run build

# Run tests
npm run test
```

## Workspace Layout

This repository is an npm-workspaces monorepo. The main packages are:

- `app/` — React application and Playwright tests
- `bundler/` — application bundler, development server, and minifier transforms
- `css-in-js/` — build-time CSS extraction
- `db/` — in-memory database and persistence primitives
- `query-builder/` — typed SQL query builder
- `pokemon-data/`, `server-query/`, and `validator/` — data pipeline and shared
  support packages

Package-specific agent guidance is in the root `AGENTS.md` and the package
`AGENTS.md` files. Root build and test scripts orchestrate the workspaces.

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
npm run build --prefix app
```

## Development

Start the app with `npm run start`; build and test with `npm run build` and
`npm run test`. For required verification commands and the Node.js version,
see the root `AGENTS.md`. Package-specific commands and design constraints are
documented in each applicable package's `AGENTS.md`.
