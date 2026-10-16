import type { BossBattleProgressRow } from '../../../db/game-db/queries';
import {
    getVisibleProgressionItems,
    isRaidResolved,
    type ProgressionItem,
    type ProgressionItemState,
} from './progression-items';

export interface ProgressionTracker {
    completed: number;
    total: number;
    percent: number;
    nextKey: string | undefined;
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

    let completed = 0;
    let nextKey: string | undefined;
    for (const item of countedItems) {
        if (isResolved(item)) {
            completed += 1;
            continue;
        }
        if (!nextKey) {
            nextKey = item.key;
        }
    }

    const total = countedItems.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
        completed,
        total,
        percent,
        nextKey,
    };
}
