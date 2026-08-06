import type { MutationState, QueryState } from './types.ts';

const INITIAL_QUERY_STATE: QueryState = {
    status: 'pending',
    data: undefined,
    error: null,
    dataUpdatedAt: 0,
    isFetching: false,
};

const INITIAL_MUTATION_STATE: MutationState = {
    status: 'idle',
    data: undefined,
    error: null,
};

export class QueryClient {
    private queryStates = new Map<string, QueryState>();
    private mutationStates = new Map<string, MutationState>();
    private listeners = new Map<string, Set<() => void>>();
    private queryRefetchers = new Map<string, Set<() => void>>();
    // inflight promises deduplicate concurrent fetches for the same key
    private inflightPromises = new Map<string, Promise<unknown>>();

    registerQueryRefetch(key: string, refetch: () => void): () => void {
        let set = this.queryRefetchers.get(key);
        if (!set) {
            set = new Set();
            this.queryRefetchers.set(key, set);
        }
        set.add(refetch);
        return () => set?.delete(refetch);
    }

    subscribe(key: string, listener: () => void): () => void {
        let set = this.listeners.get(key);
        if (!set) {
            set = new Set();
            this.listeners.set(key, set);
        }
        set.add(listener);
        return () => set?.delete(listener);
    }

    getQuerySnapshot<TData>(key: string): QueryState<TData> {
        return (this.queryStates.get(key) ??
            INITIAL_QUERY_STATE) as QueryState<TData>;
    }

    getMutationSnapshot<TData>(key: string): MutationState<TData> {
        return (this.mutationStates.get(key) ??
            INITIAL_MUTATION_STATE) as MutationState<TData>;
    }

    fetch<TData>(
        key: string,
        queryFn: () => Promise<TData>,
        staleTime = 0,
    ): Promise<TData> {
        const current = this.queryStates.get(key);
        const isStale =
            !current ||
            current.dataUpdatedAt === 0 ||
            Date.now() - current.dataUpdatedAt > staleTime;

        if (!isStale && current?.status === 'success') {
            return Promise.resolve(current.data as TData);
        }

        const inflight = this.inflightPromises.get(key);
        if (inflight) {
            return inflight as Promise<TData>;
        }

        this.setQueryState(key, {
            ...this.getQuerySnapshot(key),
            isFetching: true,
            // keep 'success' during background refetch so consumers still see old data
            status: current?.status === 'success' ? 'success' : 'pending',
        });

        const promise = queryFn().then(
            (data) => {
                this.setQueryState(key, {
                    status: 'success',
                    data,
                    error: null,
                    dataUpdatedAt: Date.now(),
                    isFetching: false,
                });
                this.inflightPromises.delete(key);
                return data;
            },
            (error) => {
                this.setQueryState(key, {
                    status: 'error',
                    data: undefined,
                    error,
                    dataUpdatedAt: 0,
                    isFetching: false,
                });
                this.inflightPromises.delete(key);
                throw error;
            },
        );

        this.inflightPromises.set(key, promise);
        return promise;
    }

    async executeMutation<TData, TVariables>(
        key: string,
        mutationFn: (variables: TVariables) => Promise<TData>,
        variables: TVariables,
    ): Promise<TData> {
        this.setMutationState(key, {
            status: 'pending',
            data: undefined,
            error: null,
        });
        try {
            const data = await mutationFn(variables);
            this.setMutationState(key, {
                status: 'success',
                data,
                error: null,
            });
            return data;
        } catch (error) {
            this.setMutationState(key, {
                status: 'error',
                data: undefined,
                error,
            });
            throw error;
        }
    }

    invalidate(key: string): void {
        const current = this.queryStates.get(key);
        if (current) {
            this.setQueryState(key, { ...current, dataUpdatedAt: 0 });
        }
        for (const refetch of this.queryRefetchers.get(key) ?? []) {
            refetch();
        }
    }

    private setQueryState(key: string, state: QueryState): void {
        this.queryStates.set(key, state);
        this.notify(key);
    }

    private setMutationState(key: string, state: MutationState): void {
        this.mutationStates.set(key, state);
        this.notify(key);
    }

    private notify(key: string): void {
        for (const l of this.listeners.get(key) ?? []) {
            l();
        }
    }
}
