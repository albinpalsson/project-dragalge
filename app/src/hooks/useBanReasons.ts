import { useGame } from '../views/Game/GameContext';
import type { BanReasonMap } from '../utils/ban-list';

export function useBanReasons(): BanReasonMap {
    return useGame().banReasons;
}
