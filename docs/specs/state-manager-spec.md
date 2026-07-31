# State Manager Specification

## Research & Context

### Why Custom State Manager?

We need a lightweight, hook-based state manager that:
- Works in a single-file bundled app (no context provider overhead)
- Persists state to localStorage automatically
- Supports computed selectors (avoid re-renders on unchanged data)
- Integrates with query builder (app uses queries, not raw DB)

### Design Inspiration
- **Zustand**: Lightweight, hook-based, no providers, minimal boilerplate
- **Custom approach**: Simplified version for our specific use case (offline tracker)
- **Key difference**: Each store is a separate entity; no global provider needed

### Architecture Decision
- Multiple stores (slices): `usePartyStore`, `useEncountersStore`, `useGameProgressStore`
- Each store manages its slice of app state
- Stores communicate via queries to shared database
- Persistence middleware auto-saves to localStorage on every update

---

## Requirements (In-Scope)

### Store API
- `create(initialState, handler)`: Create a new store
- `useStore()`: React hook to read + subscribe to store
- `getState()`: Synchronous access to current state
- `setState(partial)`: Update state (shallow merge)
- `subscribe(listener)`: Direct subscription to changes

### Selectors
- Memoized selectors: Prevent recalculations on unchanged data
- Example: `usePartyStore(s => s.party.filter(p => p.level > 10))`

### Middleware
- **Persistence**: Auto-save to localStorage on state change
- **Logger** (dev): Log state changes
- **API hooks**: Before/after update callbacks

### Store Slices (Predefined)

```typescript
// Party: Current team composition
interface PartyStore {
  party: Pokémon[];
  addToParty(pokemon: Pokémon): void;
  removeFromParty(id: number): void;
  replaceTeam(pokemon: Pokémon[]): void;
}

// Caught: All Pokémon caught in this run
interface CaughtStore {
  caught: Pokémon[];
  addCaught(pokemon: Pokémon): void;
  removeCaught(id: number): void;
  getCaughtByLocation(location: string): Pokémon[];
}

// Game Progress: Visited locations, boss battles, tera raids
interface GameProgressStore {
  visitedLocations: string[];
  completedBosses: string[];
  teraRaids: TeraRaid[];
  levelCap: number;
  
  visitLocation(location: string): void;
  completeBoss(bossName: string): void;
  addTeraRaid(raid: TeraRaid): void;
  setLevelCap(level: number): void;
}

// Inventory: Items, healing supplies, etc.
interface InventoryStore {
  items: InventoryItem[];
  addItem(item: InventoryItem, count: number): void;
  removeItem(itemId: string, count: number): void;
  useItem(itemId: string): void;
}
```

### Persistence Strategy
- On every `setState()`, automatically save state to localStorage
- Load state from localStorage on app startup
- Key: `paldea-nuzlocke-{storeName}`
- Format: JSON

### Events
- Store publishes changes after each update
- Subscribers notified with new state
- Batched updates possible for performance

---

## Out of Scope (V1)

- Complex derived state / selectors (use simple function selectors)
- DevTools integration
- Time-travel debugging
- Immer/immutable helpers
- Error boundary integration
- Global state management (each store is independent)
- Async middleware / thunks

---

## Design & Architecture

### Core Concepts

```typescript
interface StoreState {
  [key: string]: any;
}

interface Listener {
  (state: StoreState): void;
}

interface Store<T extends StoreState> {
  getState(): T;
  setState(partial: Partial<T>): void;
  subscribe(listener: Listener): () => void; // returns unsubscribe function
}

interface StoreConfig<T> {
  initialState: T;
  middleware?: Middleware<T>[];
}

interface Middleware<T> {
  onBeforeUpdate?: (state: T, partial: Partial<T>) => Partial<T>;
  onAfterUpdate?: (state: T, previous: T) => void;
}
```

### API Signatures

```typescript
// Factory function
function createStore<T extends StoreState>(
  initialState: T,
  handlers?: (set: (partial: Partial<T>) => void, get: () => T) => void
): Store<T> {
  // Returns store with getState, setState, subscribe
}

// Hook (React integration)
function useStore<T extends StoreState, S>(
  store: Store<T>,
  selector?: (state: T) => S
): S {
  // Subscribe on mount, unsubscribe on unmount
  // Return state slice or full state
}

// Middleware helpers
function persistMiddleware<T>(key: string): Middleware<T>;
function loggerMiddleware<T>(prefix: string): Middleware<T>;

// Pre-built stores
export const usePartyStore = createStore<PartyStore>(...);
export const useCaughtStore = createStore<CaughtStore>(...);
export const useGameProgressStore = createStore<GameProgressStore>(...);
export const useInventoryStore = createStore<InventoryStore>(...);
```

### Implementation Strategy

1. **Store Factory**: Create store with listeners + state
2. **React Hook**: Use effect to subscribe; return state or selector result
3. **Persistence Middleware**: Hook into setState to auto-save to localStorage
4. **Selector Memoization**: Compare previous/current selector output; skip re-render if equal

### Example Usage

```typescript
// Create store
const useGameProgress = createStore(
  {
    levelCap: 10,
    visitedLocations: [],
    completedBosses: []
  },
  (set, get) => ({
    setLevelCap: (level) => set({ levelCap: level }),
    visitLocation: (loc) => set({
      visitedLocations: [...get().visitedLocations, loc]
    })
  })
);

// In component
function LevelCapSelector() {
  const levelCap = useGameProgress(s => s.levelCap); // Selector only re-runs if levelCap changed
  const setLevelCap = useGameProgress(s => s.setLevelCap);
  
  return (
    <div>
      <p>Level Cap: {levelCap}</p>
      <button onClick={() => setLevelCap(levelCap + 1)}>Increase</button>
    </div>
  );
}

// Persistence (automatic)
// State saved to localStorage on every update
```

---

## Verification

### Unit Tests
- [ ] Store creation: Initial state set correctly
- [ ] `setState`: Partial updates merge correctly
- [ ] `subscribe`: Listeners called on state change
- [ ] Selectors: Memoization prevents unnecessary recalculations
- [ ] Unsubscribe: Listener not called after unsubscribe
- [ ] Middleware: Before/after hooks execute correctly
- [ ] Persistence: State saved to localStorage, loaded on startup
- [ ] Error handling: Invalid state updates, missing handlers

### Integration Tests
- [ ] Multiple stores: Changes in one don't affect others
- [ ] React hook: Component re-renders only on selector change
- [ ] Persistence cycle: Save → reload app → verify state

### Performance Targets
- Store update: <1ms
- Selector evaluation: <1ms
- localStorage round-trip: <5ms

---

## TODOs

### Core Implementation
- [ ] Create `createStore` factory function
- [ ] Implement `getState` and `setState`
- [ ] Implement `subscribe` and listener notification
- [ ] Create React `useStore` hook
- [ ] Implement selector memoization
- [ ] Create persistence middleware
- [ ] Create logger middleware (dev)
- [ ] Implement pre-built stores (Party, Caught, GameProgress, Inventory)

### Store Handlers
- [ ] Party store: addToParty, removeFromParty, replaceTeam
- [ ] Caught store: addCaught, removeCaught, getCaughtByLocation
- [ ] GameProgress store: visitLocation, completeBoss, addTeraRaid, setLevelCap
- [ ] Inventory store: addItem, removeItem, useItem

### Integration with Query Builder
- [ ] Store methods use query builder to read/write DB
- [ ] Example: `addCaught` → `query('pokemon').insert(...)`
- [ ] Example: `getCaughtByLocation` → `query('pokemon').where('location', '=', ...).get()`

### Testing
- [ ] Unit tests for all store operations
- [ ] Unit tests for middleware
- [ ] React hook tests (with mock React)
- [ ] Integration tests: Store → Query → DB round-trip
- [ ] Persistence tests: Save → reload → verify

### Documentation
- [ ] API docs for store creation
- [ ] Example: Building a custom store
- [ ] Selector best practices (memoization)
- [ ] Middleware guide

---

## Module Files

```
src/core/state-manager/
  ├── store.ts        # createStore factory + Store class
  ├── hook.ts         # useStore React hook
  ├── middleware.ts   # Persistence, Logger middleware
  ├── stores/
  │   ├── party.ts
  │   ├── caught.ts
  │   ├── progress.ts
  │   └── inventory.ts
  ├── types.ts        # TypeScript interfaces
  └── index.ts        # Exports
```

