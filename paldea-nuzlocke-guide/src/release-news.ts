


import { literal, number, object, parse } from '@project-dragalge/validator';

export interface ReleaseNews {
    number: number;
}

// Append increasing positive numbers only when there is news worth announcing.
// Never reuse numbers; publish significant revisions as a new release. These
// numbers are independent of app versions.
// Define content fields when a presentation is chosen; keep the catalogue bundled
// with the app so news works offline and describes features available in that build.
export const RELEASE_NEWS: readonly ReleaseNews[] = [];

export const LATEST_NEWS_NUMBER = RELEASE_NEWS.reduce(
    (latest, news) => Math.max(latest, news.number),
    0,
);

export function getPendingReleaseNews(
    acknowledgedThrough: number,
): readonly ReleaseNews[] {
    // A checkpoint suits chronological news for returning browsers. If eligibility
    // later depends on game variant or feature usage, use acknowledged IDs instead:
    // a checkpoint could otherwise skip news that only becomes relevant later.
    return RELEASE_NEWS.filter((news) => news.number > acknowledgedThrough);
}

export interface ReleaseNewsCheckpoint {
    acknowledgedThrough: number;
    persisted: boolean;
}

export const RELEASE_NEWS_STORAGE_KEY = 'paldea-nuzlocke-guide:release-news';

// Keep this browser-level preference outside game saves, exports, and analytics.
// Missing state means an unrecognized browser, not necessarily a new person:
// clearing storage, private browsing, and another device all lose this history.
export function loadReleaseNewsCheckpoint(): ReleaseNewsCheckpoint {
    try {
        const stored = readAcknowledgedThrough();
        if (stored !== null) {
            return { acknowledgedThrough: stored, persisted: true };
        }
    } catch (error) {
        console.error('Could not read the release news checkpoint.', error);
        return { acknowledgedThrough: LATEST_NEWS_NUMBER, persisted: false };
    }

    // First visits baseline at current news rather than announcing old changes.
    // With an empty catalogue this stores 0, preparing today's visitors for news 1.
    return storeReleaseNewsCheckpoint(LATEST_NEWS_NUMBER);
}

export function storeReleaseNewsCheckpoint(
    acknowledgedThrough: number,
): ReleaseNewsCheckpoint {
    if (!Number.isSafeInteger(acknowledgedThrough) || acknowledgedThrough < 0) {
        throw new RangeError('Invalid release news checkpoint.');
    }

    // Re-read before writing so stale tabs and older builds preserve higher values.
    // localStorage is not transactional; this is not exactly-once delivery across tabs.

    let next = acknowledgedThrough;
    try {
        const stored = readAcknowledgedThrough();
        next = Math.max(acknowledgedThrough, stored ?? 0);
        window.localStorage.setItem(
            RELEASE_NEWS_STORAGE_KEY,
            JSON.stringify({ schemaVersion: 1, acknowledgedThrough: next }),
        );
        return { acknowledgedThrough: next, persisted: true };
    } catch (error) {
        console.error('Could not save the release news checkpoint.', error);
        return { acknowledgedThrough: next, persisted: false };
    }
}

const checkpointSchema = object({
    schemaVersion: literal(1),
    acknowledgedThrough: number(),
});

// null means missing; unreadable or unsupported state throws and is not overwritten.
function readAcknowledgedThrough(): number | null {
    const raw = window.localStorage.getItem(RELEASE_NEWS_STORAGE_KEY);
    if (raw === null) {
        return null;
    }
    const value = parse(checkpointSchema, JSON.parse(raw));
    return value.acknowledgedThrough;
}
