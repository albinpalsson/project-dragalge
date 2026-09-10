import { css } from '@pokedb2/css-in-js';
import { Button } from './Button';
import { EncounterRandomizer } from './EncounterRandomizer';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { useEncounterRoll } from '../hooks/useEncounterRoll';
import { useEncounterActions } from '../hooks/useEncounterActions';
import { useGame } from '../views/Game/GameContext';

interface RollActionsProps {
    locationName: string;
    encounters: LocationEncounterView[];
}

const STATUSES = ['caught', 'missed', 'eliminated'] as const;
const STATUS_LABELS = {
    caught: 'Caught',
    missed: 'Missed',
    eliminated: 'Eliminated',
} as const;

export function RollActions({ locationName, encounters }: RollActionsProps) {
    const game = useGame();
    const encounterRoll = useEncounterRoll(locationName);
    const encounterActions = useEncounterActions();

    const setStatus = (status: (typeof STATUSES)[number]) => {
        if (status === 'caught') {
            return encounterActions.catchEncounter(locationName);
        }
        if (status === 'missed') {
            return encounterActions.missEncounter(locationName);
        }
        return encounterActions.eliminateEncounter(locationName);
    };

    return (
        <div className={actionRow}>
            <EncounterRandomizer
                encounters={encounters}
                randomizerMode={game.randomizerMode}
                disabled={
                    encounterActions.isBusy || encounterRoll !== undefined
                }
                onPick={(encounter) =>
                    encounterActions.rollEncounter(encounter.name, locationName)
                }
            />
            {encounterRoll &&
                STATUSES.map((status) => (
                    <Button
                        key={status}
                        variant="secondary"
                        onClick={() => void setStatus(status)}
                        disabled={
                            encounterActions.isBusy ||
                            encounterRoll.status === status
                        }
                    >
                        {STATUS_LABELS[status]}
                    </Button>
                ))}
            {encounterRoll && (
                <Button
                    variant="secondary"
                    onClick={() => encounterActions.clearRoll(locationName)}
                    disabled={encounterActions.isBusy}
                >
                    Clear
                </Button>
            )}
        </div>
    );
}

const actionRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;
