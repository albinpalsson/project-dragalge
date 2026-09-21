import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { GameRun } from '../../db/game-db/queries';
import type { EncounterRollRow } from '../../db/game-db/queries';
import type { RandomizerMode } from '../../randomizer';

export interface GameContextValue {
    id: number;
    run: GameRun;
    settings: GameRun['settings'];
    randomizerMode: RandomizerMode;
    encounters: EncounterRollRow[];
}

const GameContext = createContext<GameContextValue | null>(null);

interface GameProviderProps {
    value: GameContextValue;
    children: ReactNode;
}

export function GameProvider({ value, children }: GameProviderProps) {
    const memoizedValue = useMemo(
        () => ({
            id: value.id,
            run: value.run,
            settings: value.settings,
            randomizerMode: value.randomizerMode,
            encounters: value.encounters,
        }),
        [
            value.id,
            value.run,
            value.settings,
            value.randomizerMode,
            value.encounters,
        ],
    );

    return (
        <GameContext.Provider value={memoizedValue}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame(): GameContextValue {
    const game = useContext(GameContext);
    if (!game) {
        throw new Error('useGame must be used inside GameProvider');
    }
    return game;
}
