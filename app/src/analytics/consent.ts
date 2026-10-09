export type AnalyticsConsent = 'granted' | 'denied';

const CONSENT_STORAGE_KEY = 'pokedb2:analytics-consent';

export function getStoredAnalyticsConsent(): AnalyticsConsent | null {
    try {
        const value = window.localStorage.getItem(CONSENT_STORAGE_KEY);
        return value === 'granted' || value === 'denied' ? value : null;
    } catch {
        return null;
    }
}

export function storeAnalyticsConsent(consent: AnalyticsConsent): void {
    try {
        window.localStorage.setItem(CONSENT_STORAGE_KEY, consent);
    } catch {
        // Keep the choice in memory for this page when browser storage is unavailable
    }
}
