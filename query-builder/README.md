# @project-dragalge/query-builder

This package builds typed SQL queries and keeps values separate from SQL text
as positional parameters. It does not include a database; provide a client
that runs the compiled queries.

```ts
import { createDb, type DbClient } from '@project-dragalge/query-builder';

type PokemonDb = { pokemon: { id: number; name: string } };
declare const client: DbClient;

const db = createDb<PokemonDb>(client);
const query = db
    .selectFrom('pokemon')
    .selectAll()
    .where('id', '=', 1)
    .compile();
```

`query.sql` contains the statement and `query.parameters` contains its values.

## Interfaces

The fluent query style is similar to Kysely, but this package has its own API
and adapter contract. `DbClient.execute(sql, parameters)` connects it to a
database; the adapter can be replaced while keeping the typed schema and query
code where the target database supports the generated SQL. The builder is
deliberately small: it supports equality and `IN` filters and a single
`INNER JOIN`, not subqueries or outer joins.