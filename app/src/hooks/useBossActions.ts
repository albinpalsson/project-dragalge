import { useGame } from '../views/Game/GameContext';
import {
    useBossBattleProgressQuery,
    useSetBossBattleResultMutation,
    useClearBossBattleResultMutation,
} from '../views/Game/queries';

export interface UseBossActionsResult {
    resolveBattle: (
        battleName: string,
        result: 'won' | 'lost',
    ) => Promise<void>;
    clearBattle: (battleName: string) => Promise<void>;
    isBusy: boolean;
    getBattleResult: (battleName: string) => 'won' | 'lost' | undefined;
}

export function useBossActions(): UseBossActionsResult {
    const game = useGame();
    const bossProgressQuery = useBossBattleProgressQuery(game.id);
    const setResultMutation = useSetBossBattleResultMutation();
    const clearMutation = useClearBossBattleResultMutation();

    const getBattleResult = (battleName: string) => {
        const progress = bossProgressQuery.data?.find(
            (p) => p.battle_name === battleName,
        );
        return progress?.result as 'won' | 'lost' | undefined;
    };

    return {
        resolveBattle: async (battleName: string, result: 'won' | 'lost') => {
            await setResultMutation.mutateAsync({
                gameRunId: game.id,
                battleName,
                result,
            });
        },
        clearBattle: async (battleName: string) => {
            await clearMutation.mutateAsync({
                gameRunId: game.id,
                battleName,
            });
        },
        isBusy: setResultMutation.isPending || clearMutation.isPending,
        getBattleResult,
    };
}
