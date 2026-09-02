# Query Builder Specification

## Overview

A minimal, zero-dependency SQL query builder. TypeScript method calls compile to
`{ sql, parameters }`. Execution is the caller's responsibility — the library
accepts a thin `DbClient` at initialisation and exposes `execute()` on each builder
as a convenience wrapper around `client.execute(sql, parameters)`.

Swapping the underlying database means swapping the `DbClient` adapter, not this library.
If kysely is adopted later, a kysely `Dialect` can wrap this library's `DbClient` interface.

---

## DbClient Interface

```typescript
interface DbClient {
  execute(sql: string, parameters: readonly unknown[]): Promise<unknown[]>
}
```

This is the only integration surface. The `db` package owns the better-sqlite3 adapter.

---

## Initialisation

```typescript
import { createDb } from '@pokedb2/query-builder'

const db = createDb<MyDB>(client)
```

`createDb<DB>(client: DbClient): Database<DB>` — the `DB` generic is the schema type that
drives all result and input types for the builders it returns.

---

## Operations

### SELECT

```typescript
const rows = await db
  .selectFrom('pokemon')
  .where('caught', '=', false)
  .where('location', '=', 'Route 1')
  .selectAll()
  .execute()
// Promise<MyDB['pokemon'][]>

const starters = await db
  .selectFrom('pokemon')
  .where('name', 'in', ['Sprigatito', 'Fuecoco', 'Quaxly'] as const)
  .selectAll()
  .execute()

const row = await db.selectFrom('pokemon').where('id', '=', 1).selectAll().executeTakeFirst()
// Promise<MyDB['pokemon'] | undefined>

// compile only — no client call
const { sql, parameters } = db.selectFrom('pokemon').selectAll().compile()
```

### SELECT with INNER JOIN

```typescript
const rows = await db
  .selectFrom('pokemon')
  .innerJoin('encounters', 'encounters.pokemon_id', 'pokemon.id')
  .selectAll()
  .execute()
```

### INSERT

```typescript
await db.insertInto('pokemon').values({ name: 'Pikachu', caught: true }).execute()
await db.insertInto('pokemon').values([
  { name: 'Pikachu', caught: true },
  { name: 'Bulbasaur', caught: false },
]).execute()
```

### UPDATE

```typescript
await db.updateTable('pokemon').set({ caught: true }).where('id', '=', 1).execute()
```

### DELETE

```typescript
await db.deleteFrom('pokemon').where('id', '=', 1).execute()
```

---

## SQL Output

- Identifiers are double-quoted: `"pokemon"`, `"caught"`
- Positional `?` placeholders (SQLite-compatible)
- Scalar `IN` values expand to one positional placeholder per value
- Empty `IN` arrays throw an error instead of producing invalid SQL
- `execute()` is async; adapters for sync drivers wrap in `Promise.resolve`

---

## Type Safety (V1)

In scope:
- `execute()` return type inferred from `DB[table]` via the schema generic
- `values()` accepts `Insertable<DB[table]>` (all fields required, generated columns optional)
- `set()` accepts `Partial<DB[table]>`

Out of scope:
- Compile-time validation of column names in `where`, `innerJoin`
- Column names and value types in WHERE predicates
- Join correctness checks

---

## Out of Scope (V1)

- Multiple JOINs per query
- LEFT / RIGHT / FULL joins
- OR conditions, NOT IN, LIKE, range operators
- Tuple IN and IN subqueries
- ORDER BY / LIMIT / OFFSET / DISTINCT
- GROUP BY / HAVING
- Subqueries
- Transactions
- Schema / migration management

```typescript
interface KyselyLite<DBSchema> {
  selectFrom<T extends keyof DBSchema & string>(table: T): SelectQueryBuilder<DBSchema[T]>;
  insertInto(table: string): InsertQueryBuilder;
  updateTable(table: string): UpdateQueryBuilder;
  deleteFrom(table: string): DeleteQueryBuilder;
}

interface SelectQueryBuilder<TResultRow> {
  selectAll(): this;
  where(column: string, operator: '=', value: unknown): this;
  where(column: string, operator: 'in', values: readonly unknown[]): this;
  innerJoin(table: string, leftColumn: string, rightColumn: string): this;
  compile(): CompiledQuery;
  execute<TOverride = TResultRow>(): Promise<Array<TOverride>>;
}
```

Execution rule:
- `compile()` always produces SQL + positional parameters.
- `execute()` always delegates to the DB module through the executor boundary.
- `execute()` is the only place where type inference is guaranteed in v1.

### Implementation Strategy

1. **Builder Pattern**: Store WHERE conditions, modifiers; build query contract
2. **Executor Abstraction**: Pass compiled `{ sql, parameters }` to DB executor
3. **Local Executor**: Converts query builder → DB API calls


## Verification

### Unit Tests
- [ ] Kysely-lite compatibility: selectFrom/selectAll/where/execute
- [ ] Kysely-lite compatibility: insertInto/updateTable/deleteFrom
- [ ] Compilation contract: compile() returns SQL + positional params
- [ ] Type safety scope: result type inference from table selection works
- [ ] Type safety scope: invalid column names are runtime errors (not compile-time)
- [ ] WHERE clause building: equality and scalar IN conditions joined by AND
- [ ] JOIN support: one INNER JOIN equality condition
- [ ] Execution: get(), first()
- [ ] INSERT: Single row, multiple rows
- [ ] UPDATE: With WHERE, zero matches, multiple matches
- [ ] DELETE: With WHERE, no WHERE (delete all)
- [ ] Executor swapping: Verify correct executor called
- [ ] Chaining: Multiple method chains return correct builder state

### Integration Tests
- [ ] Full query: SelectAll → WHERE
- [ ] Full query: SelectAll → INNER JOIN → WHERE
- [ ] Write → Read cycle: Insert → query back
- [ ] Multiple WHERE conditions combined with AND

### API Contract Tests
- [ ] Local executor produces same results as direct DB calls
- [ ] Query builder serializable (for future HTTP transport)

---

## TODOs

### Core Implementation
- [ ] Create `Query` class with fluent API
- [ ] Implement WHERE builder: `where()` (equality and scalar IN)
- [ ] Implement JOIN builder: `innerJoin()` (single join only)
- [ ] Implement SELECT modifier: `selectAll()`
- [ ] Implement fetch methods: `get()`, `first()`
- [ ] Implement write methods: `insert()`, `update()`, `delete()`
- [ ] Create `QueryExecutor` interface
- [ ] Implement `LocalExecutor` (uses DB layer)
- [ ] Add executor injection: `setExecutor()`
- [ ] Restrict compile-time typing to execute-result inference only

### Testing
- [ ] Unit tests for equality WHERE and single INNER JOIN
- [ ] Unit tests for unsupported operators and unsupported query clauses
- [ ] Integration tests with local DB
- [ ] Mock executor tests (verify query contract)
- [ ] Test error handling (invalid operators, missing columns)

### Documentation
- [ ] API docs with examples for each method
- [ ] Guide: How to swap executors
- [ ] Query builder serialization format (for future HTTP API)

---

## Module Files

```
src/core/query-builder/
  ├── query.ts        # Query class + fluent API
  ├── executor.ts     # Executor interface + LocalExecutor
  ├── types.ts        # TypeScript interfaces
  └── index.ts        # Exports + setExecutor
```

