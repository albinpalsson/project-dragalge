# Database Module Specification

## Research & Context

### Why Custom DB?
We need a lightweight, offline-first database that:
- Stores Pokémon encounter data and game progress locally
- Persists to localStorage as a binary snapshot for offline support
- **Provides a standardized SQL interface** for future migration to a real DB engine
- Supports basic SQL operations (SELECT, INSERT, UPDATE, DELETE with WHERE)
- Does NOT require a heavy dependency like sql.js (WASM binary overhead)

### Design Insights from Research
- **better-sqlite3 approach**: Synchronous SQL interface with parameterized queries; perfect for in-memory + Node.js (but native bindings, not for browser)
- **Drizzle approach**: SQL-first design; supports both query builders and raw SQL; architecture allows executor swapping
- **Our approach**: 
  - **SQL executor interface** (abstract, can swap implementations)
  - Parameterized queries for SQL injection safety
  - Simple, synchronous, binary-first in-memory implementation
  - Designed to enable future migration to PostgreSQL/MySQL by swapping the executor

### Key Decision
Build a **standardized SQL interface** with:
1. Raw SQL execution via `execute(sql, params)` (like better-sqlite3, Drizzle)
2. Prepared statements for efficiency (like better-sqlite3)
3. Query builder abstraction on top (delegating to raw SQL)
4. Abstract executor interface for future backend swapping

### Compatibility Goal (Clarified)
Support two seamless migration directions with the same app-facing API:
1. **Swap to real SQLite** by replacing the executor implementation only.
2. **Use Kysely with our DB** by exposing a Kysely-compatible SQLite adapter over our engine.

This means app code should not care whether queries are executed by:
- `InMemoryExecutor` (current)
- `SqliteExecutor` (future real SQLite)
- `Kysely` (future query builder layer) using our adapter

### Recommendation Summary

#### Step 1 Recommendation (Query Builder Target)
Adopt a **Kysely-style query builder contract** as the target compatibility surface, implemented as a minimal subset in v1.

Type safety is intentionally limited in v1 to **query result inference**.
Compile-time validation of table/column/operator correctness is out of scope.

#### Step 2 Recommendation (SQLite Driver Contract)
Use the **better-sqlite3-compatible interface expected by Kysely's SQLite dialect** as the driver compatibility shape:
- `database.close()`
- `database.prepare(sql)`
- statement `reader`
- statement `all(parameters)`
- statement `run(parameters)` returning `{ changes, lastInsertRowid }`
- statement `iterate(parameters)`

This gives us one interface that supports both goals:
- real SQLite swapping, and
- Kysely interop with our custom engine.

---

## Requirements (In-Scope)

### Operations Supported

#### Raw SQL Interface (Primary)
- `execute(sql, params?)`: Execute raw SQL with parameterized values
  - Example: `db.execute("SELECT * FROM pokemon WHERE id = ?", [1])`
  - Example: `db.execute("INSERT INTO pokemon (name, level) VALUES (?, ?)", ["Pikachu", 5])`
  - Example: `db.execute("UPDATE pokemon SET caught = 1 WHERE id = ?", [1])`
  - Returns: Array of objects for SELECT, `{ changes: number }` for INSERT/UPDATE/DELETE

#### Prepared Statements (Efficiency)
- `prepare(sql)`: Create prepared statement for repeated execution
  - `stmt.bind(params)`: Bind parameters once
  - `stmt.all()`: Execute and get all rows
  - `stmt.get()`: Execute and get first row
  - `stmt.run()`: Execute write operation

#### High-Level Convenience Methods (for app code)
- `insert(table, row)`: Helper (uses raw SQL internally)
- `select(table, where?)`: Helper (uses raw SQL internally)
- `update(table, set, where)`: Helper (uses raw SQL internally)
- `delete(table, where)`: Helper (uses raw SQL internally)

### WHERE Clause & SQL Support
- **Parameterized queries**: `?` placeholders for safe value binding
  - Example: `SELECT * FROM pokemon WHERE location = ? AND caught = ?` with params `['Mt. Moon', true]`
- **Equality predicates only**: `column = ?`
- **AND logic only** (no OR for v1)
- **Minimal JOIN support**: single `INNER JOIN` for critical relational lookups
- **Basic SQL operations**: SELECT, INSERT, UPDATE, DELETE, CREATE TABLE
- Examples:
  ```sql
  SELECT * FROM pokemon WHERE location = ? AND caught = ?
  UPDATE encounters SET visited = 1 WHERE location = ?
  INSERT INTO caught (pokemon_id, caught_at) VALUES (?, ?)
  SELECT * FROM encounters e INNER JOIN pokemon p ON e.pokemon_id = p.id WHERE e.game_id = ?
  ```

### JOIN Scope (V1)
- Support exactly one `INNER JOIN` between two tables in a single query.
- Support equality join predicates only: `left.col = right.col`.
- No multi-join chains.
- No `LEFT/RIGHT/FULL` joins.
- No join condition expressions beyond simple equality.
- Correctness over performance: nested-loop join implementation is acceptable.

### Application-Level Data Integrity Protocol (V1)

Engine-level constraints are intentionally minimal for v1.

- `PRIMARY KEY`, `UNIQUE`, and `FOREIGN KEY` may be declared in schema metadata for documentation only.
- The engine does not enforce those constraints in v1.
- The application layer is responsible for:
  - ID generation and stable identity
  - de-duplication checks before insert where needed
  - referential consistency checks in critical flows

### Parameterized Query Safety
- All user input must use `?` placeholders
- Values passed separately in params array
- Protects against SQL injection
- Works with both raw SQL and prepared statements

### Persistence
- `export()`: Serialize all tables to a compact binary `Uint8Array`
- `import(data)`: Load tables from the binary format
- `load()`: Ask the configured persistence plugin for a snapshot and import it
- `save()`: Export current snapshot and hand it to the configured persistence plugin
- Auto-save hook: Notify when data changes (for state manager integration)

### Persistence Plugin Goal
- The DB engine owns the in-memory binary representation.
- Persistence is a separate pluggable module responsible only for reading/writing snapshot blobs.
- Different app surfaces can choose different persistence plugins without changing DB behavior.

Examples:
- Browser app flow: in-memory DB + `LocalStoragePersistencePlugin`
- Desktop or Node flow: in-memory DB + `FilePersistencePlugin`
- Test flow: in-memory DB + `MemoryPersistencePlugin`

### Storage Constraints (V1)
- **Binary-first runtime storage**: Tables are stored internally as fixed-width binary row buffers, not arrays of JS row objects.
- **Fixed-width primitives + hybrid strings**: `int32`, `float64`, `boolean`, `timestamp`, `char(n)`, and `text`.
- **Hybrid string strategy**:
  - `char(n)` for short predictable strings stored inline in row bytes.
  - `text` for variable-sized strings stored in an append-only table text section, with row-level references.
- **No null support**: Every column must have a value; defaults must be provided by app code or schema definition.
- **Schema is fixed after table creation**: No `ALTER TABLE` in v1.
- **Deletes use tombstones**: Deleting a row marks its slot deleted.
- **Compaction is controlled**: Dead rows are removed only during an explicit or threshold-triggered compaction pass.

### Error Handling
- Throw on schema mismatch (INSERT with wrong columns)
- Throw on invalid WHERE syntax
- Graceful handling of missing columns in WHERE clauses
- Throw when a `char(n)` value exceeds its allocated byte length

---

## Out of Scope (V1)

- Transactions / ACID guarantees
- Complex joins (more than one join, non-equality predicates, outer joins)
- Aggregate functions (COUNT, SUM, AVG)
- Subqueries
- `OR` predicates
- Non-equality WHERE operators (`>`, `<`, `>=`, `<=`, `IN`, `LIKE`)
- `ORDER BY`, `LIMIT`, `OFFSET`, `DISTINCT`
- Triggers / stored procedures
- Indexes (beyond primary key)
- Constraint enforcement (`PRIMARY KEY`, `UNIQUE`, `FOREIGN KEY`)
- Advanced SQL (CTEs, window functions)
- Query optimization
- Variable-length binary/blob fields
- Nullable columns
- Runtime schema alterations

---

## Design & Architecture

### Core Data Structure

```typescript
type ColumnType = 'int32' | 'float64' | 'boolean' | 'timestamp' | 'char' | 'text';

interface ColumnDefinition {
  name: string;
  type: ColumnType;
  length?: number; // required for char(n), measured in UTF-8 bytes
  offset: number;  // byte offset within a row payload
}

interface TableSchema {
  columns: ColumnDefinition[];
  rowSize: number; // includes row status byte
  primaryKey?: string; // metadata only in v1, not enforced
}

interface TableStorage {
  name: string;
  schema: TableSchema;
  buffer: ArrayBuffer;
  view: DataView;
  textBuffer: ArrayBuffer; // append-only UTF-8 bytes for text columns
  textWriteOffset: number;
  rowCapacity: number;
  rowCount: number;
  deletedCount: number;
  freeList: number[];
}

interface Database {
  tables: Map<string, TableStorage>;
}
```

### Persistence Boundary

The database runtime format and the persistence format should be compatible but conceptually separate.

- **Runtime**: mutable table buffers, free lists, table metadata, compaction state.
- **Persistence**: a stable binary snapshot blob produced by `export()` and consumed by `import()`.

The persistence plugin does not inspect rows or schemas directly.
It only stores and retrieves the exported binary snapshot.

### Binary Row Layout

Each table is stored as fixed-size row slots in a contiguous `ArrayBuffer`.
Variable-sized strings are stored in a per-table append-only text section.

```text
row := [status: u8][column_1 bytes][column_2 bytes]...[column_n bytes]

text_ref := [offset: u32][length: u32] // offset is relative to text section start
```

Row status values:
- `0`: never used / free
- `1`: active
- `2`: deleted (tombstone)

Column encodings:
- `int32`: 4 bytes, little-endian
- `float64`: 8 bytes, little-endian
- `boolean`: 1 byte (`0` or `1`)
- `timestamp`: 8-byte `float64` storing Unix epoch milliseconds
- `char(n)`: exactly `n` UTF-8 bytes, zero-padded on write, trailing zero bytes trimmed on read
- `text`: 8-byte `text_ref` in row, bytes stored in append-only `textBuffer`

This layout intentionally avoids:
- variable-length payloads inside row slots
- null bitmaps
- per-row object allocation
- in-place compaction during normal writes

### Variable-Sized String Rules (text columns)

- Offsets are always relative to table `textBuffer` start, never process memory addresses.
- Inserts and text updates append bytes to the end of `textBuffer`.
- Normal inserts/updates do not rewrite other rows' text references.
- Rewrites of existing text references happen only during compaction/rebuild.

### API Signatures

#### Executor Interface (Abstract - enables future backend swapping)

```typescript
interface SQLExecutor {
  // Execute raw SQL with parameterized values
  execute(sql: string, params?: any[]): ExecuteResult;
  
  // Prepare statement for repeated execution
  prepare(sql: string): PreparedStatement;
  
  // Utilities
  begin(): void;      // Start transaction
  commit(): void;     // Commit transaction
  rollback(): void;   // Rollback transaction
}

interface ExecuteResult {
  changes: number;           // For INSERT/UPDATE/DELETE
  lastInsertRowid?: number;  // For INSERT
  rows?: Record<string, any>[]; // For SELECT
}

interface PreparedStatement {
  bind(params: any[]): this;
  all(): Record<string, any>[];
  get(): Record<string, any> | undefined;
  run(): ExecuteResult;
  reset(): void;
}

interface PersistencePlugin {
  read(): Promise<Uint8Array | null> | Uint8Array | null;
  write(snapshot: Uint8Array): Promise<void> | void;
  clear?(): Promise<void> | void;
}
```

#### Kysely SQLite Compatibility Interface (for future integration)

```typescript
// Subset Kysely's sqlite dialect expects from a database object.
interface KyselySqliteDatabaseCompat {
  close(): void;
  prepare(sql: string): KyselySqliteStatementCompat;
}

interface KyselySqliteStatementCompat {
  readonly reader: boolean;
  all(parameters: ReadonlyArray<unknown>): unknown[];
  run(parameters: ReadonlyArray<unknown>): {
    changes: number | bigint;
    lastInsertRowid: number | bigint;
  };
  iterate(parameters: ReadonlyArray<unknown>): IterableIterator<unknown>;
}
```

#### Adapter Strategy

```typescript
// Adapter A: Real SQLite backend for our DB API.
class SqliteExecutor implements SQLExecutor {
  constructor(private sqlite: KyselySqliteDatabaseCompat) {}
  // execute/prepare delegate to sqlite.prepare(...)
}

// Adapter B: Kysely-compatible database wrapper over our custom engine.
class KyselySqliteCompatAdapter implements KyselySqliteDatabaseCompat {
  constructor(private engine: SQLExecutor) {}
  // prepare(...) returns statement wrapper that calls engine.execute(...)
}
```

Result:
- Our app can keep calling `db.execute(...)` / `db.select(...)`.
- We can swap to real SQLite by switching executor.
- We can introduce Kysely without replacing storage engine logic.

#### DB Class (Uses executor, implements high-level API)

```typescript
class DB {
  constructor(executor: SQLExecutor, persistence?: PersistencePlugin);
  
  // ===== Raw SQL Interface (Primary) =====
  execute(sql: string, params?: any[]): ExecuteResult;
  prepare(sql: string): PreparedStatement;
  
  // ===== High-Level Convenience Methods =====
  // Schema
  createTable(name: string, schema: Omit<TableSchema, 'rowSize'>): void;
  
  // CRUD (use raw SQL internally)
  insert(table: string, row: Record<string, any>): void;
  select(
    table: string,
    where?: WhereClause
  ): Record<string, any>[];
  update(
    table: string,
    set: Record<string, any>,
    where: WhereClause
  ): number; // rows affected
  delete(table: string, where: WhereClause): number; // rows affected
  
  // ===== Persistence & Events =====
  export(): Uint8Array;
  import(data: Uint8Array): void;
  load(): Promise<boolean>; // true if snapshot was loaded
  save(): Promise<void>;
  setPersistence(plugin: PersistencePlugin | undefined): void;
  onChange(callback: (table: string) => void): void;
  
  // ===== Executor Swapping =====
  // For future migration to backend:
  setExecutor(executor: SQLExecutor): void;
}
```

#### Persistence Plugin Examples

```typescript
class LocalStoragePersistencePlugin implements PersistencePlugin {
  constructor(private key: string) {}

  read(): Uint8Array | null {
    const encoded = localStorage.getItem(this.key);
    if (!encoded) return null;
    return decodeBase64ToBytes(encoded);
  }

  write(snapshot: Uint8Array): void {
    localStorage.setItem(this.key, encodeBytesToBase64(snapshot));
  }

  clear(): void {
    localStorage.removeItem(this.key);
  }
}

class FilePersistencePlugin implements PersistencePlugin {
  constructor(private path: string) {}

  async read(): Promise<Uint8Array | null> {
    return await readFileAsBytes(this.path);
  }

  async write(snapshot: Uint8Array): Promise<void> {
    await writeFileBytes(this.path, snapshot);
  }
}
```

Design rule:
- The plugin API should stay blob-based.
- Plugins should not depend on table layout internals.
- `export()` and `import()` remain the single serialization boundary.

### Implementation Strategy

#### Executor Pattern for Future Migration

```
Current: App → DB.execute() → InMemoryExecutor → Local storage
Future:  App → DB.execute() → HTTPExecutor → Backend API → PostgreSQL
         (No app code changes!)
```

The key: **All SQL goes through the executor interface**, so we can swap implementations later.

#### V1 Implementation: InMemoryExecutor

1. **Table Storage**: Map of table name → binary `TableStorage`
2. **SQL Parsing**: 
  - Basic regex/tokenizer to extract table and WHERE
  - Parse optional single `INNER JOIN ... ON left.col = right.col`
   - Parameter binding (replace `?` with actual values)
  - WHERE clause evaluation with equality + AND only
3. **Prepared Statements**: Wrapper that stores template + parameter bindings + parser cache
4. **Persistence**: Export the same logical table data to a compact binary snapshot
5. **Change Tracking**: Emit event after each write operation (for state manager)
6. **Deletion Handling**: Mark deleted rows as tombstones and push slot indexes into `freeList`
7. **Insertion Strategy**: Reuse slots from `freeList` before growing buffer capacity
8. **Persistence Integration**: `save()`/`load()` delegate snapshot I/O to a configured plugin

#### Controlled Compaction Strategy

Compaction stays simple because row slots are fixed-width and text storage is append-only.

Algorithm:
1. Allocate a new buffer sized for active rows only.
2. Scan old rows from start to end.
3. Copy active rows sequentially into the new row buffer.
4. Repack text payloads for active rows into a new text buffer.
5. Rewrite copied rows' `text_ref` offsets to new packed text positions.
6. Rebuild `rowCount`, clear `deletedCount`, and reset `freeList`.
7. Swap the new buffers into the table.

When compaction runs:
- Manually via `compact(table)` or `compactAll()`.
- Automatically during `export()`.
- Optionally when deleted rows exceed a threshold such as 25% of allocated slots.

Why this is simple in v1:
- Variable-sized data exists only in one append-only text section.
- Row slots remain fixed-size, so row copy is fixed-size block move.
- No null bitmap means there is no side metadata to rewrite.
- No indexes means no secondary structures need updates.

#### JOIN Execution Strategy (V1)

- Implement `INNER JOIN` using a straightforward nested-loop strategy.
- Evaluate join predicate as strict equality after decoding join columns.
- Apply WHERE filtering after row pairing.
- This is intentionally not index-optimized; correctness is the priority.

#### Persistence Flow

```text
DB runtime state
  -> export()
  -> Uint8Array snapshot
  -> PersistencePlugin.write(snapshot)

PersistencePlugin.read()
  -> Uint8Array snapshot
  -> import(snapshot)
  -> DB runtime state
```

#### V2 (Future): HTTPExecutor

1. Implement same `SQLExecutor` interface
2. Send SQL + params to backend API
3. Backend executes on real PostgreSQL
4. No app code changes needed (just swap executor: `db.setExecutor(new HTTPExecutor(apiUrl))`)

#### Why This Design Works

| Aspect | V1 (In-Memory) | V2 (Backend) |
|--------|---|---|
| SQL standard | Query on local data | Query on remote DB |
| Interface | Same `SQLExecutor` | Same `SQLExecutor` |
| Parameters | `?` binding locally | `?` binding remotely |
| Result format | Objects + metadata | Objects + metadata |
| App changes | None | **None** |

#### Why Binary-First Runtime Is Reasonable Here

This is only practical because v1 deliberately constrains the model:
- fixed-width row slots
- fixed-length `char(n)` plus bounded `text` support for strings only
- no nulls
- no schema mutations
- full scans instead of indexes

Those constraints remove most of the complexity that usually makes binary-first engines expensive to build.

#### Why This Also Works for Kysely

| Aspect | Our DB + Adapter | Kysely Expectation |
|--------|---|---|
| `prepare(sql)` | Implemented by compat adapter | Required |
| Statement `all/run/iterate` | Implemented by wrapper | Required |
| Parameter passing | Positional array (`?`) | Positional array |
| Read/write detection | `reader` flag on statement | Required |
| App migration cost | Low (optional incremental adoption) | Low |

### Example Usage

```typescript
const db = new DB();

### Example Usage

#### Setup
```typescript
// V1: In-memory executor (default)
const inMemoryExecutor = new InMemoryExecutor();
const db = new DB(inMemoryExecutor);

// Create tables
db.createTable('pokemon', {
  columns: [
    { name: 'id', type: 'int32', offset: 1 },
    { name: 'name', type: 'char', length: 32, offset: 5 },
    { name: 'location', type: 'char', length: 32, offset: 37 },
    { name: 'caught', type: 'boolean', offset: 69 },
    { name: 'level', type: 'int32', offset: 70 }
  ],
  primaryKey: 'id'
});
```

Recommended default string lengths for v1:
- short names/status values: `char(32)`
- route/location names: `char(48)`
- free-form/long text: `text` columns (append-only text section)

#### Raw SQL Interface (Primary)
```typescript
// Insert (parameterized)
db.execute(
  'INSERT INTO pokemon (id, name, location, caught, level) VALUES (?, ?, ?, ?, ?)',
  [1, 'Pikachu', 'Viridian Forest', false, 5]
);

// Select with parameterized WHERE
const result = db.execute(
  'SELECT * FROM pokemon WHERE location = ? AND caught = ?',
  ['Route 1', true]
);
console.log(result.rows); // [{id: 2, name: 'Bulbasaur', ...}]

// Update
db.execute(
  'UPDATE pokemon SET caught = 1 WHERE id = ?',
  [1]
);

// Delete
const deleted = db.execute(
  'DELETE FROM pokemon WHERE location = ? AND caught = 0',
  ['Mt. Moon']
);
console.log(deleted.changes); // 3 rows deleted
```

#### Prepared Statements (Efficiency)
```typescript
// Prepare once, execute multiple times
const stmt = db.prepare('SELECT * FROM pokemon WHERE location = ?');

const route1 = stmt.bind(['Route 1']).all();
stmt.reset();

const route2 = stmt.bind(['Route 2']).all();
```

#### High-Level Convenience (for app code)
```typescript
// Insert
db.insert('pokemon', {
  id: 1,
  name: 'Pikachu',
  location: 'Viridian Forest',
  caught: false,
  level: 5
});

// Select
const caught = db.select('pokemon', {
  conditions: [{ column: 'caught', operator: '=', value: true }]
});

// Update
db.update('pokemon',
  { caught: true },
  { conditions: [{ column: 'id', operator: '=', value: 1 }] }
);

// Delete
db.delete('pokemon', {
  conditions: [{ column: 'location', operator: '=', value: 'Mt. Moon' }]
});
```

#### Persistence
```typescript
// Export for localStorage
const snapshot = db.export();
localStorage.setItem('db_snapshot', snapshot);

// Import later
const restored = localStorage.getItem('db_snapshot');
db.import(restored);
```

#### Persistence Plugins
```typescript
const db = new DB(
  inMemoryExecutor,
  new LocalStoragePersistencePlugin('pokedb_snapshot')
);

await db.load();

db.insert('pokemon', {
  id: 1,
  name: 'Pikachu',
  location: 'Viridian Forest',
  caught: false,
  level: 5
});

await db.save();
```

#### Future Migration (Executor Swapping)
```typescript
// When backend is ready, just swap executor!
const httpExecutor = new HTTPExecutor('https://api.pokedb.com/sql');
db.setExecutor(httpExecutor);

// All app code stays exactly the same
const caught = db.select('pokemon', {
  conditions: [{ column: 'caught', operator: '=', value: true }]
});
// ^ Now queries remote PostgreSQL instead of local memory!
```

---

## Verification

### Unit Tests
- [ ] Raw SQL: INSERT, SELECT, UPDATE, DELETE with parameterized values
- [ ] Prepared statements: Bind, execute multiple times, reset
- [ ] High-level methods: insert, select, update, delete
- [ ] Parameter safety: SQL injection attempts blocked
- [ ] WHERE clause evaluation: equality + AND only
- [ ] JOIN: single INNER JOIN equality predicate returns expected merged rows
- [ ] JOIN: non-matching rows are excluded (inner semantics)
- [ ] JOIN limits: reject outer joins and multi-join queries
- [ ] SQL limits: reject unsupported `OR`, `IN`, `LIKE`, `ORDER BY`, `LIMIT`
- [ ] Persistence: export() and import() round-trip
- [ ] Persistence plugins: localStorage plugin read/write round-trip
- [ ] Persistence plugins: file plugin read/write round-trip
- [ ] Persistence plugins: `load()` no-op when no snapshot exists
- [ ] Binary encoding: int32, float64, boolean, timestamp, char(n), text_ref
- [ ] String bounds: reject UTF-8 strings that exceed `char(n)`
- [ ] text columns: append-only writes and stable existing offsets during normal insert/update
- [ ] Tombstones: deleted rows are skipped by scans and reused by inserts
- [ ] Compaction: live rows preserved, deleted rows removed, freeList reset, text_ref rewritten correctly
- [ ] Events: onChange fired on INSERT/UPDATE/DELETE
- [ ] Executor swapping: setExecutor() changes behavior
- [ ] Constraint protocol: app-level uniqueness/referential checks covered by integration tests

### Integration Tests
- Load seed data (Pokémon table) → query by location → verify results
- Update encounter status → export → import → verify persistence
- Multiple queries in sequence without cross-contamination

### Performance Targets
- Insert 1000 rows: <10ms
- Select with WHERE from 1000 rows: <5ms
- Export/import 1000 rows: <20ms

---

## TODOs

### Core Implementation
- [ ] Create `SQLExecutor` interface (abstract)
- [ ] Create `InMemoryExecutor` class (implements SQLExecutor)
  - [ ] Binary table storage and schema validation
  - [ ] Basic SQL parsing (SELECT, INSERT, UPDATE, DELETE)
  - [ ] Minimal INNER JOIN parsing (`tableA INNER JOIN tableB ON a.col = b.col`)
  - [ ] Parameter binding (? → values)
  - [ ] WHERE clause evaluation (equality + AND only)
  - [ ] Nested-loop INNER JOIN execution (correctness-first)
  - [ ] Rejection errors for unsupported SQL clauses/operators
  - [ ] Fixed-width row encoder/decoder
  - [ ] text_ref encoder/decoder and per-table textBuffer manager
  - [ ] Tombstone tracking and free-slot reuse
  - [ ] Controlled compaction
- [ ] Create `DB` class wrapping executor
  - [ ] Raw SQL: `execute()` method
  - [ ] Prepared statements: `prepare()` method
  - [ ] High-level convenience methods (insert, select, update, delete)
  - [ ] Executor swapping: `setExecutor()` method
  - [ ] Persistence plugin wiring: `load()`, `save()`, `setPersistence()`
- [ ] Implement binary persistence (export/import)
- [ ] Create `PersistencePlugin` interface
- [ ] Create `LocalStoragePersistencePlugin`
- [ ] Create `FilePersistencePlugin`
- [ ] Add onChange event system
- [ ] Add schema helpers for `char(n)` sizing and row-size calculation

### Testing
- [ ] Unit tests: Raw SQL execution (INSERT, SELECT, UPDATE, DELETE)
- [ ] Unit tests: Prepared statement binding and execution
- [ ] Unit tests: Parameter safety (SQL injection attempts)
- [ ] Unit tests: WHERE clause combinations (AND + equality only)
- [ ] Unit tests: unsupported clause/operator rejection
- [ ] Unit tests: schema metadata acceptance without key enforcement
- [ ] Unit tests: Persistence (export/import round-trip)
- [ ] Integration tests: Full workflow (insert → select → update → delete)
- [ ] Performance tests: 1000+ rows, measure query time
- [ ] Executor swapping: Verify interface compatibility

### Future (V2+)
- [ ] HTTPExecutor: Send SQL to backend API
- [ ] SqliteExecutor: Real SQLite implementation of SQLExecutor
- [ ] KyselySqliteCompatAdapter: Kysely-compatible wrapper over SQLExecutor
- [ ] Complex queries: JOIN, GROUP BY, aggregate functions
- [ ] Join performance improvements (hash join or indexed lookup)
- [ ] Additional join types (LEFT/RIGHT/FULL)
- [ ] Full WHERE operator support (`IN`, `LIKE`, ranges, `OR`)
- [ ] `ORDER BY`, `LIMIT`, `OFFSET`, `DISTINCT`
- [ ] Transactions: BEGIN/COMMIT/ROLLBACK
- [ ] Indexes: Beyond primary key
- [ ] Engine-level key and foreign key enforcement
- [ ] Schema migrations
- [ ] Value-ID indirection for text (optional optimization)
- [ ] Nullable columns and null bitmaps
- [ ] Page-based storage and incremental compaction

### Documentation
- [ ] API reference: SQLExecutor interface
- [ ] API reference: PersistencePlugin interface
- [ ] API reference: Kysely compatibility adapter
- [ ] API reference: DB class methods
- [ ] Usage guide: Raw SQL vs high-level methods
- [ ] Usage guide: Selecting a persistence plugin per runtime
- [ ] Usage guide: Using Kysely with custom engine
- [ ] Migration guide: How to add HTTPExecutor for backend
- [ ] Migration guide: How to swap InMemoryExecutor -> SqliteExecutor
- [ ] Troubleshooting: Common SQL errors
- [ ] Persistence format spec

---

## Module Files

```
src/core/db/
  ├── executor.ts         # SQLExecutor interface (abstract)
  ├── in-memory.ts        # InMemoryExecutor implementation
  ├── binary-codec.ts     # Fixed-width row encoding/decoding helpers
  ├── text-store.ts       # Append-only per-table text section helpers
  ├── compaction.ts       # Table compaction helpers
  ├── persistence.ts      # PersistencePlugin interface + common helpers
  ├── storage-local.ts    # localStorage persistence plugin
  ├── storage-file.ts     # file-based persistence plugin
  ├── sqlite-executor.ts  # SQLExecutor using real SQLite connection
  ├── kysely-adapter.ts   # KyselySqliteDatabaseCompat wrapper
  ├── db.ts               # DB class (wraps executor)
  ├── sql-parser.ts       # SQL parsing (SELECT, INSERT, UPDATE, DELETE)
  ├── query-builder.ts    # WHERE clause builder + helpers
  ├── types.ts            # TypeScript interfaces
  └── index.ts            # Exports
```

