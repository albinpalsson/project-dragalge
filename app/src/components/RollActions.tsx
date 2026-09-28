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

export function RollActions({ locationName, encounters }: RollActionsProps) {
    const game = useGame();
    const encounterRoll = useEncounterRoll(locationName);
    const encounterActions = useEncounterActions();
    const highlightResolutionActions = encounterRoll?.status === 'pending';

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
                hasExistingRoll={Boolean(encounterRoll)}
                disabled={encounterActions.isBusy}
                onPick={(encounter) =>
                    encounterActions.rollEncounter(encounter.name, locationName)
                }
            />
            {encounterRoll && (
                <>
                    <Button
                        variant="secondary"
                        className={
                            highlightResolutionActions
                                ? pendingActionHighlight
                                : undefined
                        }
                        ariaLabel="Caught"
                        title="Caught"
                        onClick={() => void setStatus('caught')}
                        disabled={
                            encounterActions.isBusy ||
                            encounterRoll.status === 'caught'
                        }
                    >
                        🎯
                    </Button>
                    <Button
                        variant="secondary"
                        className={
                            highlightResolutionActions
                                ? pendingActionHighlight
                                : undefined
                        }
                        ariaLabel="Missed"
                        title="Missed"
                        onClick={() => void setStatus('missed')}
                        disabled={
                            encounterActions.isBusy ||
                            encounterRoll.status === 'missed'
                        }
                    >
                        🏃
                    </Button>
                    <Button
                        variant="secondary"
                        ariaLabel="Eliminated"
                        title="Eliminated"
                        onClick={() => void setStatus('eliminated')}
                        disabled={
                            encounterActions.isBusy ||
                            encounterRoll.status === 'eliminated'
                        }
                    >
                        💀
                    </Button>
                </>
            )}
        </div>
    );
}

const actionRow = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;

const pendingActionHighlight = css`
    &&& {
        border-color: var(--color-accent-warm);
    }
`;
