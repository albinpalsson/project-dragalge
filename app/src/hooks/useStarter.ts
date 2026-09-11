import { STARTER_LOCATION_NAME } from '../db/game-db/queries';
import { useGame } from '../views/Game/GameContext';

export function useStarter(): string | undefined {
    const game = useGame();
    return game.encounters.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    )?.pokemon_name;
}
