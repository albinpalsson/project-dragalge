


import { literal, number, object, parse } from '@project-dragalge/validator';
import type { ActiveView } from './router';

export interface ReleaseNews {
    number: number;
    title: string;
    // Plain-text paragraphs, shown in order.
    paragraphs: readonly string[];
    // Opens a view in the app. It acknowledges the news like any dismissal.
    action?: { label: string; view: ActiveView };
    // A page outside the app, such as the privacy policy.
    link?: { label: string; href: string };
}

// Append increasing positive numbers only when there is news worth announcing.
// Never reuse numbers; publish significant revisions as a new release. These
// numbers are independent of app versions.
// Keep the catalogue bundled with the app so news works offline and describes
// features available in that build. All pending news is shown in one popup.
export const RELEASE_NEWS: readonly ReleaseNews[] = [
    {
        number: 1,
        title: 'Mono type planner',
        paragraphs: [
            'Planning a mono-type run? The new planner estimates how hard a run with each type will be, boss by boss.',
            'It is experimental and less accurate than the rest of the guide, so treat its ratings as a rough heads-up. You can find it in the menu.',
        ],
        action: { label: 'Open the planner', view: { view: 'monoPlanner' } },
    },
    {
        number: 2,
        title: 'Keep your games in Google Drive',
        paragraphs: [
            'You can now keep your games in your own Google Drive instead of this browser, so you can play on any device. Choose where with the "Stored in" setting under Stored games on Home.',
            'Games live in one place at a time. Switching does not move or delete anything: your games in this browser stay here and come back when you switch back. To move a game, export it and import it in the other place.',
        ],
        link: { label: 'Privacy policy', href: '/privacy.html' },
    },
];

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
