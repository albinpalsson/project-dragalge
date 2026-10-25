import { useGame } from '../views/Game/GameContext';
import { useBossBattleProgressQuery } from '../views/Game/queries';
import { useStarter } from './useStarter';
import {
    calculateProgression,
    type ProgressionTracker,
} from '../views/Game/progression/progression-tracker';

export function useProgressionTracker(): ProgressionTracker {
    const game = useGame();
    const starter = useStarter();
    const bossProgressQuery = useBossBattleProgressQuery(game.name);
    const bossProgress = bossProgressQuery.data ?? [];
    const state = {
        settings: game.settings,
        encounters: game.encounters,
    };
    return calculateProgression(state, bossProgress, starter);
}
