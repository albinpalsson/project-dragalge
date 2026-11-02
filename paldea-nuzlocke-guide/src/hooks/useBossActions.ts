import { useGame } from '../views/Game/GameContext';
import {
    useBossBattleProgressQuery,
    useSetBossBattleResultMutation,
    useClearBossBattleResultMutation,
} from '../views/Game/queries';
import { track } from '../analytics/analytics';

export interface UseBossActionsResult {
    resolveBattle: (
        battleName: string,
        result: 'won' | 'lost',
    ) => Promise<void>;
    clearBattle: (battleName: string) => Promise<void>;
    isBusy: boolean;
}

export function useBossResult(battleName: string) {
    const game = useGame();
    const resultQuery = useBossBattleProgressQuery(game.name, {
        select: (progress) =>
            progress.find((row) => row.battle_name === battleName)?.result,
    });
    return resultQuery.data;
}

export function useBossActions(): UseBossActionsResult {
    const game = useGame();
    const setResultMutation = useSetBossBattleResultMutation();
    const clearMutation = useClearBossBattleResultMutation();

    return {
        resolveBattle: async (battleName: string, result: 'won' | 'lost') => {
            await setResultMutation.mutateAsync({
                gameName: game.name,
                battleName,
                result,
            });
            track({
                name: 'progression_milestone',
                milestone: battleName,
                outcome: result,
            });
        },
        clearBattle: async (battleName: string) => {
            await clearMutation.mutateAsync({
                gameName: game.name,
                battleName,
            });
        },
        isBusy: setResultMutation.isPending || clearMutation.isPending,
    };
}
