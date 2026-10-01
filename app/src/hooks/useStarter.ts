import { STARTER_LOCATION_NAME } from '../db/game-db/queries';
import { useGame } from '../views/Game/GameContext';
import { useEvolutionGraphQuery } from './useEvolutionGraphQuery';

// Returns the starter's base evolution stage, regardless of its current evolved form.
export function useStarter(): string | null {
    const game = useGame();
    const { data: evolutionGraph } = useEvolutionGraphQuery();
    const currentName = game.encounters.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    )?.pokemon_name;
    if (!currentName) {
        return null;
    }
    if (!evolutionGraph) {
        // Game waits for this query before rendering its children.
        throw new Error('useStarter requires the evolution graph to be loaded');
    }
    return evolutionGraph.getFirstStage(currentName) ?? currentName;
}
