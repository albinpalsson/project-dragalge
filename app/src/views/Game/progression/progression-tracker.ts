import type { BossBattleProgressRow } from '../../../db/game-db/queries';
import {
    getVisibleProgressionItems,
    isRaidResolved,
    type ProgressionItem,
    type ProgressionItemState,
} from './progression-items';

export interface ProgressionTracker {
    total: number;
    percent: number;
    nextKey: string | undefined;
    firstUnresolvedKey: string | undefined;
}

export function calculateProgression(
    state: ProgressionItemState,
    bossProgress: BossBattleProgressRow[],
    starter: string | null,
): ProgressionTracker {
    const visibleItems = getVisibleProgressionItems(state);
    const countedItems = visibleItems.filter(
        (item) => item.countsTowardProgress?.(state) ?? true,
    );

    const isResolved = (item: ProgressionItem): boolean => {
        if (item.kind === 'info') {
            return true;
        }
        if (item.kind === 'encounter') {
            return state.encounters.some(
                (encounter) =>
                    encounter.location_name === item.locationName &&
                    encounter.status !== 'pending',
            );
        }
        if (item.kind === 'action') {
            return item.isResolved(state);
        }
        if (item.kind === 'raid') {
            return isRaidResolved(state.encounters, item.stars);
        }
        const battleName = starter ? item.getBattleName(starter) : undefined;
        if (!battleName) {
            return false;
        }
        return bossProgress.some((battle) => battle.battle_name === battleName);
    };

    const resolvedItems = countedItems.map(isResolved);
    const firstUnresolvedIndex = resolvedItems.findIndex(
        (resolved) => !resolved,
    );
    const firstUnresolvedKey =
        firstUnresolvedIndex < 0
            ? undefined
            : countedItems[firstUnresolvedIndex].key;
    let latestResolvedBossIndex = -1;
    for (let index = 0; index < countedItems.length; index += 1) {
        if (countedItems[index].kind === 'boss' && resolvedItems[index]) {
            latestResolvedBossIndex = index;
        }
    }
    const nextIndex = resolvedItems.findIndex(
        (resolved, index) => index > latestResolvedBossIndex && !resolved,
    );
    const nextKey = nextIndex < 0 ? undefined : countedItems[nextIndex].key;

    const total = countedItems.length;
    const percent =
        nextIndex === -1 ? 100 : Math.round((nextIndex / total) * 100);

    return {
        total,
        percent,
        nextKey,
        firstUnresolvedKey,
    };
}
