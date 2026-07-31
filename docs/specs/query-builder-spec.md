# Query Builder Specification

## Research & Context

### Why a Query Builder Layer?

The query builder is the **critical abstraction** for future backend migration. By building a query interface *now*, we can:
- Write app code that works with local DB today
- Swap executor (DB → HTTP API) in the future without touching app logic
- Support complex queries with a consistent, readable API
- Decouple state manager from DB implementation details

### Design Pattern
- **Fluent API**: Chainable methods for readability
- **Lazy evaluation**: Build query, execute on demand
- **Provider pattern**: Query executor is swappable (local DB, REST API, GraphQL)
- **Similar to**: Knex.js, TypeORM QueryBuilder (but much simpler)

### Key Insight
Query builder is NOT just SQL generation; it's a **query contract** between app and data layer.

### Recommendation (Step 1)
Use a **Kysely-style query builder surface** as the compatibility target, but implement only a small v1 subset.

Why this target:
- Popular and TypeScript-first.
- Clear builder-to-executor boundary that is easy to replicate in a minimal implementation.
- Works naturally with positional SQL parameters and swappable execution backends.

V1 compatibility subset to implement:
1. `selectFrom(table).selectAll().where(column, op, value).execute()`
2. `insertInto(table).values(row | row[]).execute()`
3. `updateTable(table).set(partial).where(...).execute()`
4. `deleteFrom(table).where(...).execute()`
5. Compile to `{ sql, parameters }` and delegate execution to DB executor

Non-goals for v1 compatibility:
- Full Kysely parity (joins, expression builder, plugins, schema builder)
- Compile-time validation of table names, column names, operators, and join correctness

### Type Safety Scope (V1)

Type safety in v1 is intentionally limited to **query result inference only**.

In scope:
- `execute()` result type inference for known table selections.
- Optional explicit result typing (for custom projections) through generic override.

Out of scope:
- Compile-time checks for table names.
- Compile-time checks for column names in `where`, `join`, `orderBy`.
- Compile-time operator validation beyond basic method signatures.
- Compile-time join condition correctness.

Assumption:
- Application code is responsible for writing correct queries in v1.

---

## Requirements (In-Scope)

### Operations Supported
- `SELECT`: Fetch rows with filtering
- `INSERT`: Add single or multiple rows
- `UPDATE`: Modify rows matching criteria
- `DELETE`: Remove rows matching criteria

### WHERE Clause Support
- Equality: `where('status', '=', 'caught')`
- AND chains: Multiple `where()` calls

### Selectors & Joins
- `selectAll()`: Return all columns from selected table(s)
- `innerJoin(...)`: Single `INNER JOIN` equality join for one critical relational use case
- `first()`: Get single row or null

### Inserts & Updates
- `insert(data)`: Insert one or multiple rows
- `update(data)`: Update fields matching WHERE clause
- `delete()`: Remove matching rows

### API Style

```typescript
// SELECT
query('pokemon')
  .where('location', '=', 'Route 1')
  .where('caught', '=', false)
  .get(); // Execute

// INSERT
query('pokemon').insert([
  { name: 'Pikachu', level: 5, caught: true },
  { name: 'Bulbasaur', level: 3, caught: false }
]);

// UPDATE
query('encounters')
  .where('id', '=', 1)
  .update({ visited: true });

// DELETE
query('encounters')
  .where('location', '=', 'Route 1')
  .delete();

// Kysely-style compatibility subset (v1 target)
qb.selectFrom('pokemon')
  .selectAll()
  .where('location', '=', 'Route 1')
  .execute();

qb.insertInto('pokemon')
  .values({ name: 'Pikachu', level: 5, caught: true })
  .execute();
```

---

## Out of Scope (V1)

- Join chains (more than one JOIN in a query)
- Non-equality join conditions
- LEFT/RIGHT/FULL joins
- Group By / HAVING
- Subqueries
- Transactions
- Complex WHERE logic (OR clauses, ranges, IN, LIKE)
- ORDER BY / LIMIT / OFFSET / DISTINCT
- Query optimization hints
- Migrations / schema management

---

## Design & Architecture

### Core Concepts

```typescript
interface QueryBuilder {
  table: string;
  whereConditions: WhereCondition[];
  join?: {
    table: string;
    leftColumn: string;
    rightColumn: string;
  };
}

interface WhereCondition {
  column: string;
  operator: '=';
  value: any;
}

interface QueryExecutor {
  select(builder: QueryBuilder): Record<string, any>[];
  insert(table: string, rows: Record<string, any>[]): number;
  update(table: string, set: Record<string, any>, where: WhereCondition[]): number;
  delete(table: string, where: WhereCondition[]): number;
  count(table: string, where: WhereCondition[]): number;
}

interface CompiledQuery {
  sql: string;
  parameters: ReadonlyArray<unknown>;
}
```

### API Signatures

```typescript
class Query {
  constructor(table: string, executor: QueryExecutor);

  // WHERE clause builders
  where(column: string, operator: '=', value: any): this;
  innerJoin(table: string, leftColumn: string, rightColumn: string): this;

  // SELECT modifiers
  selectAll(): this;

  // Execution
  get(): Record<string, any>[]; // SELECT
  first(): Record<string, any> | null; // SELECT LIMIT 1

  // Write operations (can be chained with WHERE)
  insert(rows: Record<string, any>[] | Record<string, any>): number; // rows inserted
  update(set: Record<string, any>): number; // rows updated
  delete(): number; // rows deleted
}

// Factory function
function query(table: string): Query {
  return new Query(table, defaultExecutor);
}

// Executor injection (for testing / swapping implementations)
function setExecutor(executor: QueryExecutor): void;
```

### Kysely-Style Compatibility API (V1)

```typescript
interface KyselyLite<DBSchema> {
  selectFrom<T extends keyof DBSchema & string>(table: T): SelectQueryBuilder<DBSchema[T]>;
  insertInto(table: string): InsertQueryBuilder;
  updateTable(table: string): UpdateQueryBuilder;
  deleteFrom(table: string): DeleteQueryBuilder;
}

interface SelectQueryBuilder<TResultRow> {
  selectAll(): this;
  where(column: string, operator: string, value: unknown): this;
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
2. **Executor Abstraction**: Pass compiled `{ sql, parameters }` to DB executor (local DB or HTTP)
3. **Local Executor**: Converts query builder → DB API calls
4. **HTTP Executor** (future): Converts query builder → HTTP POST with JSON payload

### Example: Building for Future REST API

```typescript
// Today: Local DB executor
class LocalExecutor implements QueryExecutor {
  constructor(private db: DB) {}
  
  select(builder: QueryBuilder) {
    return this.db.select(builder.table, builder.whereConditions, ...);
  }
  
  insert(table, rows) {
    rows.forEach(r => this.db.insert(table, r));
    return rows.length;
  }
}

// Tomorrow: REST API executor
class HTTPExecutor implements QueryExecutor {
  async select(builder: QueryBuilder) {
    const res = await fetch('/api/query', { 
      method: 'POST', 
      body: JSON.stringify(builder) 
    });
    return res.json();
  }
  
  async insert(table, rows) {
    const res = await fetch(`/api/${table}`, {
      method: 'POST',
      body: JSON.stringify({ rows })
    });
    return res.json().count;
  }
}

// Swap seamlessly
setExecutor(new HTTPExecutor());
```

---

## Verification

### Unit Tests
- [ ] Kysely-lite compatibility: selectFrom/selectAll/where/execute
- [ ] Kysely-lite compatibility: insertInto/updateTable/deleteFrom
- [ ] Compilation contract: compile() returns SQL + positional params
- [ ] Type safety scope: result type inference from table selection works
- [ ] Type safety scope: invalid column names are runtime errors (not compile-time)
- [ ] WHERE clause building: Single condition, multiple AND (equality only)
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
- [ ] Implement WHERE builder: `where()` (equality only)
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

