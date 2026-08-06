# Application Architecture Specification

## Research & Context

### Purpose
This spec defines the overall structure of the Paldea Nuzlocke tracker app, integrating all custom core modules and defining the component hierarchy, data flow, and user interactions.

### Architecture Principles
1. **Data-Centric**: All state flows through query builder + store manager
2. **Offline-First**: App works completely offline; localStorage for persistence
3. **Unidirectional Data Flow**: Views → Actions → Store → DB → Views
4. **Composable Components**: Build UI from small, focused components
5. **CSS Encapsulation**: Each component owns its styles via css-in-js

### Build Pipeline

```
TypeScript source files (.ts, .tsx)
          ↓
CSS-in-JS Transformer (extract css() → .css + replace with classnames)
          ↓
tsc transpilation (.ts → .js)
          ↓
Bundler (ESM import tracing → concatenate → single app.js)
          ↓
CSS file (collected from imports)
          ↓
Plugin: Minify (optional, optional → minified app.js)
          ↓
Plugin: (future plugins as needed)
          ↓
Output:
  ├─ dist/app.js (bundled, optionally minified)
  ├─ dist/app.css (concatenated from all CSS imports)
  └─ dist/index.html (links to both app.js and app.css)
```

**Build Steps (npm run build):**
1. Run CSS-in-JS transformer → collect CSS, rewrite imports
2. Run tsc → transpile to dist/
3. Run bundler → trace ESM imports, concatenate modules
4. Run minifier plugin → reduce JS size
5. Collect CSS files → single dist/app.css
6. Generate index.html → links to app.js + app.css
7. Done: Three-file output ready for deployment

---

## Requirements (In-Scope)

### Core Views
1. **Home Screen**: Start run, load existing run, settings
2. **Party View**: Display current team, swap/remove members
3. **Caught Pokémon List**: Browse all caught Pokémon, filter by location
4. **Location Explorer**: Browse Paldea locations, see available encounters
5. **Encounter Tracker**: Mark caught Pokémon from each location
6. **Boss Battles**: Track story battles (Gym Leaders, Titan Pokémon, Team Star)
7. **Tera Raids**: Log Tera raid encounters
8. **Level Cap Selector**: Set/adjust level limit for team
9. **Settings**: Reset run, export data, etc.

### Legal Attribution (When Using Bulbapedia-Derived Seed Data)
- The app must expose a visible legal notice in Settings/About linking to:
  - Bulbapedia source page(s)
  - Bulbapedia copyright/license page
  - CC BY-NC-SA 2.5 license text
- The legal notice must state that Bulbapedia-derived data is used under
  CC BY-NC-SA 2.5 and is non-commercial/share-alike.
- This requirement applies even when data is bundled inline in app assets.

### Data Model

```typescript
// Core entities (aligned with DB schema)
interface Pokemon {
  id: number;
  name: string;
  type1: string;
  type2?: string;
  baseStats: {
    hp: number;
    attack: number;
    defense: number;
    spAtk: number;
    spDef: number;
    speed: number;
  };
  evolution?: string; // Evolved form name
}

interface Location {
  id: number;
  name: string;
  region: string;
  encounters: EncounterData[];
}

interface EncounterData {
  pokemonId: number;
  rarity: 'common' | 'uncommon' | 'rare';
  minLevel: number;
  maxLevel: number;
}

// Run state (tracked in stores)
interface CaughtPokemon extends Pokemon {
  dateCaught: Date;
  locationCaught: string;
  levelCaught: number;
  isDead: boolean;
  deathLocation?: string;
}

interface TeamMember extends CaughtPokemon {
  currentLevel: number;
  currentHP: number;
  status?: 'healthy' | 'poisoned' | 'burned' | 'frozen' | 'paralyzed';
}

interface BossBattle {
  id: string;
  name: string;
  type: 'gym' | 'titan' | 'team_star';
  defeated: boolean;
  defeatDate?: Date;
  teamUsed?: number[]; // IDs of team members
}

interface TeraRaid {
  id: string;
  pokemonId: number;
  type: string;
  completed: boolean;
  completionDate?: Date;
}

interface GameRun {
  id: string;
  startDate: Date;
  name: string;
  version: 'scarlet' | 'violet';
  starter: Pokemon;
  levelCap: number;
  state: 'active' | 'completed' | 'lost';
}
```

### Component Hierarchy

```
<App>
  ├─ <Router> (in-memory state-based routing)
  │  ├─ <HomeView>
  │  ├─ <PartyView>
  │  │  ├─ <TeamMemberCard>
  │  │  ├─ <SwapModal>
  │  │  └─ <HealthTracker>
  │  ├─ <CaughtListView>
  │  │  ├─ <PokemonCard>
  │  │  ├─ <FilterBar>
  │  │  └─ <SearchBox>
  │  ├─ <LocationExplorerView>
  │  │  ├─ <LocationCard>
  │  │  ├─ <EncounterList>
  │  │  └─ <EncounterMarker>
  │  ├─ <EncounterTrackerView>
  │  │  ├─ <EncounterForm>
  │  │  └─ <CaughtConfirmation>
  │  ├─ <BossBattleView>
  │  │  ├─ <BattleCheckbox>
  │  │  └─ <BattleList>
  │  ├─ <TeraRaidView>
  │  │  ├─ <RaidForm>
  │  │  └─ <RaidLog>
  │  ├─ <LevelCapView>
  │  │  └─ <LevelCapSlider>
  │  └─ <SettingsView>
  │     ├─ <ExportButton>
  │     ├─ <ImportButton>
  │     └─ <ResetButton>
  └─ <Notification>
```

### State Management

Stores (Zustand-like, persisted to localStorage):
- **PartyStore**: Current team, team size limits, roster management
- **CaughtStore**: All Pokémon caught this run, death tracking
- **GameProgressStore**: Visited locations, completed battles, tera raids, level cap
- **SettingsStore**: App preferences (dark mode, sound, etc.)

### Data Flow

```
User Action (click button)
  ↓
Component Event Handler
  ↓
Dispatch Action (e.g., "addToParty")
  ↓
Store Handler
  ↓
Query Builder (e.g., "INSERT INTO party ...")
  ↓
Database
  ↓
Auto-Save to localStorage (persistence middleware)
  ↓
Store notifies subscribers
  ↓
Components re-render with new state
  ↓
UI updates
```

### Key Features

1. **Offline Persistence**
   - All data stored locally in DB + localStorage
   - No server needed
   - Export/import backup as JSON

2. **Mobile Responsive**
   - Touch-friendly UI (large tap targets)
   - Responsive layout (flex-based)
   - Works on 320px (phone) to desktop widths

3. **Error Resilience**
   - Graceful handling of data corruption
   - Recovery mechanisms (reset or restore from backup)

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

### Component Structure (React-like)

```typescript
// Base component interface
interface Component {
  (props: Record<string, any>): HTMLElement;
}

// Example component
function PokemonCard(props: { pokemon: Pokemon; onSelect: () => void }): HTMLElement {
  const element = document.createElement('div');
  
  const cardClass = css({
    padding: '12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f5f5f5'
    }
  });
  
  element.className = cardClass;
  element.innerHTML = `
    <h3>${props.pokemon.name}</h3>
    <p>Type: ${props.pokemon.type1}</p>
  `;
  element.addEventListener('click', props.onSelect);
  
  return element;
}
```

### Router (In-Memory State-Based)

```typescript
type Route = 'home' | 'party' | 'caught' | 'locations' | 'encounters' | 'bosses' | 'raids' | 'levelcap' | 'settings';

interface RouterState {
  currentRoute: Route;
  params?: Record<string, any>;
}

function navigate(route: Route, params?: Record<string, any>) {
  useRouterStore.setState({ currentRoute: route, params });
}
```

### Layout Structure

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Paldea Nuzlocke Tracker</title>
  <style>
    /* Base CSS (global styles) */
  </style>
</head>
<body>
  <div id="app">
    <!-- Router renders components here -->
  </div>
  <script>
    // Bundled app code
  </script>
</body>
</html>
```

### Styling Strategy

1. **Global Styles**: Base HTML resets, typography, layout foundations (plain CSS)
2. **Component Styles**: All component styles via `css()` function (scoped class names)
3. **Colors/Theme**: CSS variables or constants (define once, use everywhere)
4. **Responsive**: Mobile-first approach, media queries for breakpoints

### Database Schema

```sql
CREATE TABLE pokemon (
  id INTEGER PRIMARY KEY,
  name TEXT,
  type1 TEXT,
  type2 TEXT,
  baseStats JSON -- {hp, attack, defense, ...}
);

CREATE TABLE locations (
  id INTEGER PRIMARY KEY,
  name TEXT,
  region TEXT
);

CREATE TABLE encounters (
  id INTEGER PRIMARY KEY,
  locationId INTEGER,
  pokemonId INTEGER,
  rarity TEXT,
  minLevel INTEGER,
  maxLevel INTEGER
);

CREATE TABLE caught (
  id INTEGER PRIMARY KEY,
  pokemonId INTEGER,
  runId TEXT,
  dateCaught DATE,
  locationCaught TEXT,
  levelCaught INTEGER,
  isDead BOOLEAN,
  deathLocation TEXT
);

CREATE TABLE party (
  id INTEGER PRIMARY KEY,
  runId TEXT,
  pokemonId INTEGER,
  currentLevel INTEGER,
  currentHP INTEGER,
  status TEXT
);

CREATE TABLE boss_battles (
  id TEXT PRIMARY KEY,
  runId TEXT,
  name TEXT,
  type TEXT,
  defeated BOOLEAN,
  defeatDate DATE
);

CREATE TABLE tera_raids (
  id TEXT PRIMARY KEY,
  runId TEXT,
  pokemonId INTEGER,
  teraType TEXT,
  completed BOOLEAN,
  completionDate DATE
);

CREATE TABLE game_runs (
  id TEXT PRIMARY KEY,
  startDate DATE,
  name TEXT,
  version TEXT,
  starterId INTEGER,
  levelCap INTEGER,
  state TEXT
);
```

---

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

### Data & DB
- [ ] Design schema for all entities
- [ ] Create seed data (Pokémon, locations, encounters)
- [ ] Initialize DB on app startup
- [ ] Implement data migration/versioning (for future updates)

### Core Components
- [ ] Create component base (render to DOM)
- [ ] Build Home view
- [ ] Build Party view + team management UI
- [ ] Build Caught Pokémon list + filtering
- [ ] Build Location explorer + encounter marking
- [ ] Build Boss battle tracker
- [ ] Build Tera raid tracker
- [ ] Build Level cap selector
- [ ] Build Settings view
- [ ] Add Settings/About legal notice section for data attribution links

### Router & Navigation
- [ ] Implement in-memory router (no URL changes)
- [ ] Create navigation menu
- [ ] Handle route transitions
- [ ] Persist route state (optional)

### Styling
- [ ] Define global CSS (reset, typography, layout)
- [ ] Create color palette + constants
- [ ] Style all components with css-in-js
- [ ] Test responsive layout at breakpoints

### Integration
- [ ] Wire components to stores
- [ ] Wire stores to DB queries
- [ ] Test data persistence (close & reopen app)
- [ ] Test state synchronization across views

### Testing
- [ ] Manual testing of all views
- [ ] Test offline persistence
- [ ] Test export/import
- [ ] Mobile device testing

### Documentation
- [ ] User guide: How to use the app
- [ ] Data model diagram
- [ ] Component hierarchy diagram
- [ ] State flow diagram

---

## Module Files

```
src/app/
  ├── index.ts              # Entry point, bootstrap app
  ├── router.ts             # In-memory router
  ├── views/
  │   ├── home.ts           # Home screen
  │   ├── party.ts          # Team management
  │   ├── caught.ts         # Caught Pokémon list
  │   ├── locations.ts      # Location explorer
  │   ├── encounters.ts     # Encounter tracker
  │   ├── bosses.ts         # Boss battle tracker
  │   ├── raids.ts          # Tera raid tracker
  │   ├── level-cap.ts      # Level cap selector
  │   └── settings.ts       # Settings
  ├── components/
  │   ├── pokemon-card.ts
  │   ├── party-member.ts
  │   ├── location-card.ts
  │   ├── modal.ts
  │   ├── button.ts
  │   ├── input.ts
  │   └── notification.ts
  ├── stores/
  │   ├── party.ts
  │   ├── caught.ts
  │   ├── progress.ts
  │   └── router.ts
  ├── schema/
  │   ├── schema.ts         # DB schema definition
  │   └── seed-data.ts      # Pokémon & location data
  ├── styles/
  │   ├── globals.ts        # Global CSS
  │   ├── colors.ts         # Color constants
  │   └── breakpoints.ts    # Media query breakpoints
  └── types/
      └── index.ts          # TypeScript interfaces
```

