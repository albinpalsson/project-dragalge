import { STARTER_LOCATION_NAME } from '../db/game-db/queries';
import { useGame } from '../views/Game/GameContext';
import { useFirstEvolutionStageQuery } from '../views/Game/queries';

// Returns the starter's base evolution stage, regardless of its current evolved form.
export function useStarter(): string | undefined {
    const game = useGame();
    const currentName = game.encounters.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    )?.pokemon_name;
    return useFirstEvolutionStageQuery(currentName ?? '').data;
}
