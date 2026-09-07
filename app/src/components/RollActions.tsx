import { css } from '@pokedb2/css-in-js';
import { Button } from './Button';
import { EncounterRandomizer } from './EncounterRandomizer';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { useEncounterRoll } from '../hooks/useEncounterRoll';
import { useEncounterRollActions } from '../hooks/useEncounterRollActions';
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
    const actions = useEncounterRollActions(locationName);

    return (
        <div className={actionRow}>
            <EncounterRandomizer
                encounters={encounters}
                randomizerMode={game.randomizerMode}
                disabled={actions.isBusy || encounterRoll !== undefined}
                onPick={actions.pickEncounter}
            />
            {encounterRoll &&
                STATUSES.map((status) => (
                    <Button
                        key={status}
                        variant="secondary"
                        onClick={() => actions.setStatus(status)}
                        disabled={
                            actions.isBusy || encounterRoll.status === status
                        }
                    >
                        {STATUS_LABELS[status]}
                    </Button>
                ))}
            {encounterRoll && (
                <Button
                    variant="secondary"
                    onClick={actions.clearRoll}
                    disabled={actions.isBusy}
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
