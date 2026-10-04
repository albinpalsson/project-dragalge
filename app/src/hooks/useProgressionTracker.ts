import { useGame } from '../views/Game/GameContext';
import { useBossBattleProgressQuery } from '../views/Game/queries';
import { useStarter } from './useStarter';
import {
    getVisibleProgressionItems,
    isRaidResolved,
    type ProgressionItem,
} from '../views/Game/progression/progression-items';

export interface ProgressionTracker {
    completed: number;
    total: number;
    percent: number;
    nextKey: string | undefined;
}

export function useProgressionTracker(): ProgressionTracker {
    const game = useGame();
    const starter = useStarter();
    const bossProgressQuery = useBossBattleProgressQuery(game.id);
    const bossProgress = bossProgressQuery.data ?? [];
    const visibleItems = getVisibleProgressionItems({
        settings: game.settings,
        encounters: game.encounters,
    });
    const countedItems = visibleItems.filter(
        (item) =>
            item.countsTowardProgress?.({
                settings: game.settings,
                encounters: game.encounters,
            }) ?? true,
    );

    const isResolved = (item: ProgressionItem): boolean => {
        if (item.kind === 'encounter') {
            return game.encounters.some(
                (encounter) =>
                    encounter.location_name === item.locationName &&
                    encounter.status !== 'pending',
            );
        }
        if (item.kind === 'action') {
            return item.isResolved({
                settings: game.settings,
                encounters: game.encounters,
            });
        }
        if (item.kind === 'raid') {
            return isRaidResolved(game.encounters, item.stars);
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
