# Database Instructions

`@pokedb2/db` is a small in-memory SQL engine backed by fixed-layout binary
table buffers. Keep its supported SQL, row encoding, and storage plugin
contracts explicit and test changes at the database boundary.

## Data and Storage Contracts

- `src/types.ts` defines supported column types and `StoragePlugin`. The current
  column types are `int32`, `uint8`, `boolean`, `timestamp`, and fixed-width
  `char`; there is no SQL `NULL` value. Do not add implicit conversions or
  sentinel behavior without updating codecs and tests.
- Table rows are stored in `ArrayBuffer` slots with a status byte, and table
  metadata/layout is defined by the code. Coordinate changes to the layout,
  codecs, and persistence encoding; existing snapshots are not self-describing
  schemas.
- `StoragePlugin.read()` and `write()` may be synchronous or asynchronous.
  `DB.load()` and `DB.save()` cross that boundary asynchronously. Preserve
  write scheduling and explicit save behavior when changing persistence.
- Parameter values are bound separately from SQL using positional `?`
  placeholders. Do not interpolate values into SQL. Keep identifier handling
  constrained to the parser/query-builder contract.
- Deletes mark row slots inactive for reuse; do not treat deletion as an
  immediate compaction of every table buffer.

## SQL Boundary

- The engine parses a deliberately small SQL subset in `src/sql-parser.ts` and
  executes it in `src/db.ts`. Check the parser and execution path before
  relying on a SQL feature: supported statements are SELECT, INSERT, UPDATE,
  DELETE, CREATE TABLE, with equality/IN filters and at most one INNER JOIN.
- Keep the synchronous `DB.execute()` result compatible with the
  `DbClient.execute()` contract in `@pokedb2/query-builder`, which also permits
  asynchronous clients.
- Do not fold app-specific localStorage ownership, schema versioning, or
  multi-tab policy into this generic engine. Those are responsibilities of
  app storage adapters.

## Commands

From the repository root:

```powershell
npm run build --prefix db
npm run test --prefix db
npm run lint --prefix db
```