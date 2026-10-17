# Query Builder Instructions

`@pokedb2/query-builder` generates parameterized SQL against the `DbClient`
interface; it does not own a database implementation.

## Contracts and Limits

- `src/types.ts` owns `DbClient`, `CompiledQuery`, and row type helpers.
  `DbClient.execute(sql, parameters)` may return rows synchronously or through
  a promise; keep adapters compatible with both.
- `createDb()` in `src/database.ts` binds a client to a typed schema. Keep
  table/column inference and builder result types aligned when changing the
  public API.
- Query values must remain positional parameters, not interpolated into SQL.
  Identifiers are quoted by the builder; do not treat value parameters as a
  way to bind table or column names.
- The builder deliberately exposes a small operation set. Check the builders
  and tests before assuming SQL support: filters are equality or `in`, joins
  are a single `INNER JOIN`, and there is no general boolean-expression,
  subquery, or outer-join API.
- Empty `in` lists are rejected. Preserve that explicit behavior rather than
  silently broadening or narrowing a query.
- The query builder's API limits are distinct from engine limits. When a
  change depends on a capability, verify both generated SQL here and the
  receiving `DbClient` implementation.

## Commands

From the repository root:

```powershell
npm run build --prefix query-builder
npm run test --prefix query-builder
npm run lint --prefix query-builder
```

After changing the public builder contract, rebuild dependent workspace
packages before testing app behavior.