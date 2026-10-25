const STORAGE_KEY = 'paldea-nuzlocke-guide:activeGameRunId';

export function getStoredGameName(): string | null {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored && stored.length > 0 ? stored : null;
}

export function setStoredGameName(gameName: string | null): void {
    if (gameName === null) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
    }

    window.localStorage.setItem(STORAGE_KEY, gameName);
}
