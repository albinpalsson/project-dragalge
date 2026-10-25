export { QueryClient } from './client.ts';
export type {
    InvalidateFilters,
    MutationOptions,
    MutationState,
    MutationStatus,
    QueryOptions,
    QueryState,
    QueryStatus,
} from './types.ts';

import { QueryClient } from './client.ts';
import type { InvalidateFilters } from './types.ts';

export function createQueryClient(): QueryClient {
    return new QueryClient();
}

export function invalidateQueries(
    client: QueryClient,
    filters: InvalidateFilters,
): void {
    client.invalidate(JSON.stringify(filters.queryKey));
}

export function removeQueries(
    client: QueryClient,
    filters: InvalidateFilters,
): void {
    client.remove(JSON.stringify(filters.queryKey));
}
