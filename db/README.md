# @project-dragalge/db

This package is a small in-memory database that executes a limited SQL subset.
It stores table rows in binary buffers and can load or save them through a
storage plugin.

```ts
import { DB } from '@project-dragalge/db';

const db = new DB();
db.execute('CREATE TABLE pokemon (id INT, name CHAR(32))', []);
db.execute('INSERT INTO pokemon (id, name) VALUES (?, ?)', [1, 'Sprigatito']);
const rows = db.execute('SELECT id, name FROM pokemon WHERE id = ?', [1]);
```

## Interfaces

Queries use SQL with positional `?` parameters. A different SQL engine can use
the same supported queries through an adapter that implements
`execute(sql, parameters)`, as used by the query builder. This is not a SQLite
file format or driver. It is a custom, single-client in-memory database and is
not optimized as a production database. Its SQL support is limited to common
statements, equality and `IN` filters, and one `INNER JOIN`.