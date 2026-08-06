export type QueryStatus = 'pending' | 'success' | 'error';
export type MutationStatus = 'idle' | 'pending' | 'success' | 'error';

export interface QueryState<TData = unknown> {
    status: QueryStatus;
    data: TData | undefined;
    error: unknown;
    dataUpdatedAt: number;
    isFetching: boolean;
}

export interface MutationState<TData = unknown> {
    status: MutationStatus;
    data: TData | undefined;
    error: unknown;
}

export interface QueryOptions<TData = unknown> {
    queryKey: unknown[];
    queryFn: () => Promise<TData>;
    staleTime?: number;
}

export interface MutationOptions<TData = unknown, TVariables = void> {
    mutationFn: (variables: TVariables) => Promise<TData>;
}

export interface InvalidateFilters {
    queryKey: unknown[];
}
