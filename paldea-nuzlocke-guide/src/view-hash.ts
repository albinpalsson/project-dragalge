import type { ActiveView } from './router';

type LinkableView = Exclude<ActiveView, { view: 'home' } | { view: 'game' }>;

// Static pages that can be opened with a link such as `/#/about`.
// Games are not linkable: they are local saves.
const VIEW_HASHES: Record<LinkableView['view'], string> = {
    about: '#/about',
    friendship: '#/friendship',
    randomizerModes: '#/randomizer-modes',
    licenses: '#/licenses',
};

export function viewFromHash(hash: string): ActiveView | undefined {
    for (const view of Object.keys(VIEW_HASHES) as LinkableView['view'][]) {
        if (VIEW_HASHES[view] === hash) {
            return { view };
        }
    }
    return undefined;
}

export function hashForView(view: ActiveView): string {
    return view.view === 'home' || view.view === 'game'
        ? ''
        : VIEW_HASHES[view.view];
}

export function urlForView(view: ActiveView): string {
    return `${window.location.pathname}${window.location.search}${hashForView(view)}`;
}
