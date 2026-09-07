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

export type UseQueryResult<TData, TError extends Error = Error> =
    | {
          status: 'pending';
          data: undefined;
          error: null;
          isPending: true;
          isSuccess: false;
          isError: false;
          isFetching: boolean;
      }
    | {
          status: 'success';
          data: TData;
          error: null;
          isPending: false;
          isSuccess: true;
          isError: false;
          isFetching: boolean;
      }
    | {
          status: 'error';
          data: undefined;
          error: TError;
          isPending: false;
          isSuccess: false;
          isError: true;
          isFetching: boolean;
      };

function toQueryResult<TData, TError extends Error>(
    state: QueryState<TData, TError>,
): UseQueryResult<TData, TError> {
    if (state.status === 'success') {
        return {
            status: 'success',
            data: state.data as TData,
            error: null,
            isPending: false,
            isSuccess: true,
            isError: false,
            isFetching: state.isFetching,
        };
    }
    if (state.status === 'error') {
        return {
            status: 'error',
            data: undefined,
            error: state.error as TError,
            isPending: false,
            isSuccess: false,
            isError: true,
            isFetching: state.isFetching,
        };
    }
    return {
        status: 'pending',
        data: undefined,
        error: null,
        isPending: true,
        isSuccess: false,
        isError: false,
        isFetching: state.isFetching,
    };
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

    return toQueryResult(state);
}

// ─── useMutation ─────────────────────────────────────────────────────────────

type MutationResultState<TData, TError extends Error = Error> =
    | {
          status: 'idle';
          data: undefined;
          error: null;
          isIdle: true;
          isPending: false;
          isSuccess: false;
          isError: false;
      }
    | {
          status: 'pending';
          data: undefined;
          error: null;
          isIdle: false;
          isPending: true;
          isSuccess: false;
          isError: false;
      }
    | {
          status: 'success';
          data: TData;
          error: null;
          isIdle: false;
          isPending: false;
          isSuccess: true;
          isError: false;
      }
    | {
          status: 'error';
          data: undefined;
          error: TError;
          isIdle: false;
          isPending: false;
          isSuccess: false;
          isError: true;
      };

export type UseMutationResult<
    TData,
    TVariables,
    TError extends Error = Error,
> = MutationResultState<TData, TError> & {
    mutate: (variables: TVariables) => void;
    mutateAsync: (variables: TVariables) => Promise<TData>;
    reset: () => void;
};

interface MutationState<TData, TError extends Error> {
    status: MutationStatus;
    data: TData | undefined;
    error: TError | null;
}

function toMutationResultState<TData, TError extends Error>(
    state: MutationState<TData, TError>,
): MutationResultState<TData, TError> {
    if (state.status === 'success') {
        return {
            status: 'success',
            data: state.data as TData,
            error: null,
            isIdle: false,
            isPending: false,
            isSuccess: true,
            isError: false,
        };
    }
    if (state.status === 'error') {
        return {
            status: 'error',
            data: undefined,
            error: state.error as TError,
            isIdle: false,
            isPending: false,
            isSuccess: false,
            isError: true,
        };
    }
    if (state.status === 'pending') {
        return {
            status: 'pending',
            data: undefined,
            error: null,
            isIdle: false,
            isPending: true,
            isSuccess: false,
            isError: false,
        };
    }
    return {
        status: 'idle',
        data: undefined,
        error: null,
        isIdle: true,
        isPending: false,
        isSuccess: false,
        isError: false,
    };
}

const IDLE_STATE = { status: 'idle' as const, data: undefined, error: null };

export function useMutation<
    TData,
    TVariables = void,
    TError extends Error = Error,
>(
    options: MutationOptions<TData, TVariables>,
): UseMutationResult<TData, TVariables, TError> {
    const [state, setState] =
        useState<MutationState<TData, TError>>(IDLE_STATE);

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
        ...toMutationResultState(state),
        mutate,
        mutateAsync,
        reset,
    };
}

export type { QueryClient };
export { createQueryClient };
