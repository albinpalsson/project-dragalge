import { useCallback, useEffect, useRef, useState } from 'react';
import {
    getPendingReleaseNews,
    loadReleaseNewsCheckpoint,
    RELEASE_NEWS,
    RELEASE_NEWS_STORAGE_KEY,
    type ReleaseNewsCheckpoint,
    storeReleaseNewsCheckpoint,
} from '../release-news';

export function useReleaseNews() {
    const [checkpoint, setCheckpoint] = useState<ReleaseNewsCheckpoint | null>(null);
    const currentCheckpoint = useRef(checkpoint);

    const updateCheckpoint = useCallback((next: ReleaseNewsCheckpoint) => {
        currentCheckpoint.current = next;
        setCheckpoint(next);
    }, []);

    useEffect(() => {
        const refresh = () => {
            const loaded = loadReleaseNewsCheckpoint();
            const acknowledgedThrough = Math.max(
                currentCheckpoint.current?.acknowledgedThrough ?? 0,
                loaded.acknowledgedThrough,
            );
            updateCheckpoint({
                acknowledgedThrough,
                persisted:
                    loaded.persisted &&
                    loaded.acknowledgedThrough === acknowledgedThrough,
            });
        };
        const onStorage = (event: StorageEvent) => {
            if (
                event.storageArea === window.localStorage &&
                (event.key === RELEASE_NEWS_STORAGE_KEY || event.key === null)
            ) {
                refresh();
            }
        };

        window.addEventListener('storage', onStorage);
        refresh();
        return () => window.removeEventListener('storage', onStorage);
    }, [updateCheckpoint]);

    const acknowledgeThrough = useCallback(
        (newsNumber: number): boolean => {
            const current = currentCheckpoint.current;
            if (current === null) {
                throw new Error('Release news has not been initialized.');
            }
            if (!RELEASE_NEWS.some((news) => news.number === newsNumber)) {
                throw new RangeError('Cannot acknowledge unknown release news.');
            }

            // Call only after the future UI's explicit acknowledgment action,
            // never just because news was calculated or the app was opened.
            // Pass the number actually presented, not the latest at click time.
            // Acknowledging through N retires all earlier news: present the pending
            // batch together, or intentionally make newer summaries supersede it.
            const next = storeReleaseNewsCheckpoint(
                Math.max(current.acknowledgedThrough, newsNumber),
            );
            updateCheckpoint(next);
            // Failed writes still update this page's memory, not durable history.
            return next.persisted;
        },
        [updateCheckpoint],
    );

    return {
        ready: checkpoint !== null,
        pendingNews:
            checkpoint === null
                ? []
                : getPendingReleaseNews(checkpoint.acknowledgedThrough),
        persisted: checkpoint?.persisted ?? false,
        acknowledgeThrough,
    };
}
