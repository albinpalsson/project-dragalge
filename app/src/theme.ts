const STORAGE_KEY = 'pokedb2:theme';

export type Theme = 'light' | 'dark';

function getStoredTheme(): Theme | null {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : null;
}

export function getCurrentTheme(): Theme {
    return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme): void {
    document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme): void {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
}

// Call before first render so the correct theme is applied with no flash.
export function initTheme(): void {
    applyTheme(getStoredTheme() ?? 'dark');
}
