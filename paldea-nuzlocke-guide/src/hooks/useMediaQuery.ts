import { useSyncExternalStore } from 'react';

export const MOBILE_MAX_WIDTH = '34rem';

export const mobileQuery = `(max-width: ${MOBILE_MAX_WIDTH})`;

export function useMediaQuery(query: string): boolean {
    return useSyncExternalStore(
        (onChange) => {
            if (typeof window.matchMedia !== 'function') {
                return () => undefined;
            }
            const list = window.matchMedia(query);
            list.addEventListener('change', onChange);
            return () => list.removeEventListener('change', onChange);
        },
        () => matches(query),
        () => false,
    );
}

export function useIsMobile(): boolean {
    return useMediaQuery(mobileQuery);
}

function matches(query: string): boolean {
    return (
        typeof window.matchMedia === 'function' &&
        window.matchMedia(query).matches
    );
}
