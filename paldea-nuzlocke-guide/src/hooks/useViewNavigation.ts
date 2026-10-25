import { useEffect, useRef, useState } from 'react';
import { getStoredGameName, setStoredGameName } from '../game-view-storage';
import type { ActiveView } from '../router';

interface UseViewNavigationOptions {
    onViewChange?: () => void;
    startAtHome: boolean;
}

export function useViewNavigation({
    onViewChange,
    startAtHome,
}: UseViewNavigationOptions) {
    const [activeView, setActiveView] = useState<ActiveView>(() =>
        getInitialActiveView(startAtHome),
    );
    const initialActiveView = useRef(activeView);
    const onViewChangeRef = useRef(onViewChange);
    onViewChangeRef.current = onViewChange;

    useEffect(() => {
        window.history.replaceState(initialActiveView.current, '');
    }, []);

    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            setActiveViewAndStorage(
                activeViewFromHistoryState(event.state) ?? { view: 'home' },
                setActiveView,
            );
            onViewChangeRef.current?.();
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    const navigate = (next: ActiveView) => {
        window.history.pushState(next, '');
        setActiveViewAndStorage(next, setActiveView);
        onViewChangeRef.current?.();
    };

    return { activeView, navigate };
}

function getInitialActiveView(startAtHome: boolean): ActiveView {
    if (startAtHome) {
        return { view: 'home' };
    }

    const historyView = activeViewFromHistoryState(window.history.state);
    if (historyView) {
        return historyView;
    }

    const storedGameRunId = getStoredGameName();
    return storedGameRunId
        ? { view: 'game', gameName: storedGameRunId }
        : { view: 'home' };
}

function setActiveViewAndStorage(
    next: ActiveView,
    setActiveView: (view: ActiveView) => void,
): void {
    setActiveView(next);
    setStoredGameName(next.view === 'game' ? next.gameName : null);
}

function activeViewFromHistoryState(state: unknown): ActiveView | undefined {
    if (!state || typeof state !== 'object') {
        return undefined;
    }

    const candidate = state as { view?: unknown; gameName?: unknown };
    if (
        candidate.view === 'home' ||
        candidate.view === 'about' ||
        candidate.view === 'licenses'
    ) {
        return { view: candidate.view };
    }
    if (candidate.view === 'game' && typeof candidate.gameName === 'string') {
        return { view: 'game', gameName: candidate.gameName };
    }
    return undefined;
}
