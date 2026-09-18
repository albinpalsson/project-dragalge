const STORAGE_KEY = 'pokedb2:activeGameRunId';

export function getStoredGameRunId(): string | null {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && stored.length > 0 ? stored : null;
}

export function setStoredGameRunId(gameRunId: string | null): void {
    if (gameRunId === null) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, gameRunId);
}
