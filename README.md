// README for Project Structure

# Paldea Nuzlocke Tracker - Project Structure

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Project Organization

### `/docs/specs/`
Comprehensive specifications for each module:
- `db-spec.md` - In-memory SQL database
- `query-builder-spec.md` - Query abstraction layer
- `state-manager-spec.md` - React-like state management
- `css-in-js-spec.md` - Style scoping & injection
- `bundler-spec.md` - Module bundler
- `minifier-spec.md` - JavaScript minifier
- `dev-server-spec.md` - Development server
- `app-architecture-spec.md` - Overall app architecture

### `/src/core/`
Core modules (independent implementations):
- `db/` - Database module
- `query-builder/` - Query builder abstraction
- `state-manager/` - State management (Zustand-like)
- `css-in-js/` - CSS-in-JS runtime
- `bundler/` - SPA bundler
- `minifier/` - JavaScript minifier
- `dev-server/` - Development server

### `/src/app/`
Paldea Nuzlocke Tracker application:
- `views/` - View components
- `components/` - UI components
- `stores/` - Store definitions
- `schema/` - Database schema & seed data
- `styles/` - Global styles & constants
- `types/` - TypeScript interfaces

### `/tests/`
Test infrastructure:
- `unit/` - Unit tests for core modules
- `integration/` - Integration tests for bundled app

## Architecture Overview

```
User -> Views -> Stores -> Query Builder -> Database
                          -> localStorage
```

**Data Flow:**
1. User interacts with UI (Views)
2. Views dispatch actions to Stores
3. Stores update state via Query Builder
4. Query Builder executes queries on Database
5. Database auto-saves to localStorage
6. Stores notify subscribers
7. Views re-render with new state

## Key Features

- **Offline-First**: All data stored locally, no server needed
- **Single-File Deployment**: Bundles to one `.html` file with embedded CSS/JS
- **No External Dependencies**: Custom implementations of all core modules
- **Mobile Responsive**: Works on 320px+ screens
- **Persistent State**: Auto-saves to localStorage

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

## Scope (V1)

**In Scope:**
- Single-user offline tracker
- Pokémon catching & team management
- Location encounters (one per location)
- Boss battle tracking
- Tera raid logging
- Level cap management
- Import/export backups

**Out of Scope:**
- Backend/multi-user sync (architecture supports future migration)
- UI component library (built inline)
- Advanced Pokédex features
- Move/item tracking (simplified)

## Development Workflow

### 1. Plan
- Review specs for the module you're building
- Understand dependencies (DB → Query Builder → State Manager)

### 2. Implement
- Follow spec TODOs
- Write unit tests alongside code
- Build from dependencies first (DB, then Query Builder, etc.)

### 3. Test
- Unit tests: `npm run test`
- Manual testing: `npm run dev`

### 4. Build
- `npm run build` generates bundled output
- Check `dist/` for compiled files

## Module Dependencies

```
DB (base layer)
  ↓
Query Builder (abstraction)
  ↓
State Manager + App Views
  ↓
CSS-in-JS (styling)
  ↓
Bundler (combines all)
  ↓
Minifier (optimizes)
  ↓
Dev Server (serves locally)
```

**Build Phase 1**: DB → Query Builder → State Manager (data foundation)
**Build Phase 2**: CSS-in-JS → Bundler → Minifier → Dev Server (build pipeline)
**Build Phase 3**: App Views → integrate with state (UI)

## Testing Strategy

- **Unit Tests (Node.js)**: Each module in isolation
- **Integration Tests (Browser)**: Full app in bundled environment
- **Manual Testing**: Dev server with hot-reload

## Next Steps

1. Start with DB module implementation (see `db-spec.md`)
2. Implement Query Builder (see `query-builder-spec.md`)
3. Build State Manager with store definitions
4. Implement CSS-in-JS for styling
5. Build Bundler for single-file output
6. Create Dev Server for local development
7. Build app views and connect to stores

See individual specs for detailed TODOs for each module.
