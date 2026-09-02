import {
    createQueryClient,
    type MutationOptions,
    type MutationStatus,
    type QueryClient,
    type QueryOptions,
    type QueryState,
} from '@pokedb2/server-query';
import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from 'react';

// ─── Client context ──────────────────────────────────────────────────────────

const QueryClientContext = createContext<QueryClient | null>(null);

export function QueryClientProvider({
    client,
    children,
}: {
    client: QueryClient;
    children: ReactNode;
}) {
    return <QueryClientContext value={client}>{children}</QueryClientContext>;
}

export function useClient(): QueryClient {
    const client = useContext(QueryClientContext);
    if (!client) {
        throw new Error('useClient must be used inside <QueryClientProvider>');
    }
    return client;
}

function toError(value: unknown): Error {
    if (value instanceof Error) {
        return value;
    }
    return Object.assign(new Error(String(value)), { cause: value });
}

// ─── useQuery ───────────────────────────────────────────────────────────

export interface UseQueryResult<TData, TError extends Error = Error> {
    data: TData | undefined;
    status: QueryState['status'];
    error: TError | null;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    isFetching: boolean;
}

export function useQuery<TData, TError extends Error = Error>(
    options: QueryOptions<TData>,
): UseQueryResult<TData, TError> {
    const client = useClient();
    const key = JSON.stringify(options.queryKey);
    const staleTime = options.staleTime ?? 0;

    // keep a stable ref to queryFn to avoid re-triggering the effect
    const queryFnRef = useRef(options.queryFn);
    queryFnRef.current = options.queryFn;

    const subscribe = useCallback(
        (onStoreChange: () => void) => client.subscribe(key, onStoreChange),
        [client, key],
    );

    const getSnapshot = useCallback(
        () => client.getQuerySnapshot<TData, TError>(key),
        [client, key],
    );

    const state = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

    const refetch = useCallback(() => {
        client
            .fetch(key, () => queryFnRef.current(), staleTime)
            .catch(() => {
                // error is captured in state; no need to rethrow
            });
    }, [client, key, staleTime]);

    useEffect(() => {
        refetch();
        return client.registerQueryRefetch(key, refetch);
    }, [client, key, refetch]);

    return {
        data: state.data,
        status: state.status,
        error: state.error,
        isPending: state.status === 'pending',
        isSuccess: state.status === 'success',
        isError: state.status === 'error',
        isFetching: state.isFetching,
    };
}

// ─── useMutation ─────────────────────────────────────────────────────────────

export interface UseMutationResult<
    TData,
    TVariables,
    TError extends Error = Error,
> {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    status: MutationStatus;
    data: TData | undefined;
    error: TError | null;
    isPending: boolean;
    isSuccess: boolean;
    isError: boolean;
    isIdle: boolean;
    reset: () => void;
}

interface MutationState<TData, TError extends Error> {
    status: MutationStatus;
    data: TData | undefined;
    error: TError | null;
}

const IDLE_STATE = { status: 'idle' as const, data: undefined, error: null };

export function useMutation<
    TData,
    TVariables = void,
    TError extends Error = Error,
>(
    options: MutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables, TError> {
    const [state, setState] = useState<MutationState<TData, TError>>(IDLE_STATE);

    // keep stable ref so mutate callbacks always use the latest mutationFn
    const mutationFnRef = useRef(options.mutationFn);
    mutationFnRef.current = options.mutationFn;

    const mutateAsync = useRef(
        async (variables: TVariables): Promise<TData> => {
            setState({ status: 'pending', data: undefined, error: null });
            try {
                const data = await mutationFnRef.current(variables);
                setState({ status: 'success', data, error: null });
                return data;
            } catch (error) {
                setState({
                    status: 'error',
                    data: undefined,
                    error: toError(error) as TError,
                });
                throw error;
            }
        },
    ).current;

    const mutate = useRef((variables: TVariables) => {
        mutateAsync(variables).catch(() => {
            // error captured in state
        });
    }).current;

    const reset = useRef(() => setState(IDLE_STATE)).current;

    return {
        mutate,
        mutateAsync,
        status: state.status,
        data: state.data,
        error: state.error,
        isPending: state.status === 'pending',
        isSuccess: state.status === 'success',
        isError: state.status === 'error',
        isIdle: state.status === 'idle',
        reset,
    };
}

export type { QueryClient };
export { createQueryClient };
