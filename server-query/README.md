# @project-dragalge/server-query

This package tracks the state of asynchronous queries and mutations in a
client-side cache. It deduplicates concurrent requests for the same key and
can refetch queries when their data is stale or invalidated.

```ts
import { createQueryClient } from '@project-dragalge/server-query';

const client = createQueryClient();
const pokemon = await client.fetch(
    'pokemon:1',
    () => fetchPokemon(1),
    60_000,
);
```

## Interfaces

The query keys, stale times, and query states follow ideas also used by TanStack
Query, but this package does not share its API. It exports a query client and
types, not React hooks, network transport, retries, or persistent caching. The
guide's React provider and hooks are separate app code. Replacing the cache
means changing the client calls and any React integration that uses it.