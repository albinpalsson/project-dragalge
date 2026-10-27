import { useCallback, useState } from 'react';

const STORAGE_PREFIX = 'paldea-nuzlocke-guide:game:';

// Names are user-provided and may contain ':', so encode them to keep one
// game's prefix from matching another game's keys.
function gamePrefix(gameName: string): string {
    return `${STORAGE_PREFIX}${encodeURIComponent(gameName)}:`;
}

function gameStorageKeys(gameName: string): string[] {
    const prefix = gamePrefix(gameName);
    const keys: string[] = [];
    for (let index = 0; index < window.localStorage.length; index += 1) {
        const key = window.localStorage.key(index);
        if (key?.startsWith(prefix)) {
            keys.push(key);
        }
    }
    return keys;
}

// Removes every persisted value scoped to the game; call when the game is deleted.
export function clearPersistentGameState(gameName: string): void {
    for (const key of gameStorageKeys(gameName)) {
        window.localStorage.removeItem(key);
    }
}

// Moves every persisted value scoped to the game to its new name.
export function renamePersistentGameState(
    gameName: string,
    newName: string,
): void {
    const oldPrefix = gamePrefix(gameName);
    const newPrefix = gamePrefix(newName);
    for (const key of gameStorageKeys(gameName)) {
        const value = window.localStorage.getItem(key);
        if (value !== null) {
            window.localStorage.setItem(
                `${newPrefix}${key.slice(oldPrefix.length)}`,
                value,
            );
        }
        window.localStorage.removeItem(key);
    }
}

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
    gameName: string,
    key: string,
    defaultValue: T,
): [T, (next: T | ((previous: T) => T)) => void] {
    const storageKey = `${gamePrefix(gameName)}${key}`;
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
