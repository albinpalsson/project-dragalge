import { useCallback, useState } from 'react';

function readStored<T>(storageKey: string, defaultValue: T): T {
    const stored = window.localStorage.getItem(storageKey);
    if (stored === null) {
        return defaultValue;
    }
    try {
        return JSON.parse(stored) as T;
    } catch {
        return defaultValue;
    }
}

// Like useState, but persisted in localStorage and scoped to a single game.
// `defaultValue` should be a stable value (primitive or module constant).
export function usePersistentGameState<T>(
    gameId: number,
    key: string,
    defaultValue: T,
): [T, (next: T | ((previous: T) => T)) => void] {
    const storageKey = `paldea-nuzlocke-guide:game:${gameId}:${key}`;
    const [state, setState] = useState(() => ({
        storageKey,
        value: readStored(storageKey, defaultValue),
    }));

    let current = state;
    if (state.storageKey !== storageKey) {
        current = { storageKey, value: readStored(storageKey, defaultValue) };
        setState(current);
    }

    const setValue = useCallback(
        (next: T | ((previous: T) => T)) => {
            const previous = readStored(storageKey, defaultValue);
            const value =
                typeof next === 'function'
                    ? (next as (previous: T) => T)(previous)
                    : next;
            window.localStorage.setItem(storageKey, JSON.stringify(value));
            setState({ storageKey, value });
        },
        [storageKey, defaultValue],
    );

    return [current.value, setValue];
}
