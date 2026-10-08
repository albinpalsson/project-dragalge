import { css } from '@pokedb2/css-in-js';
import { Button } from './Button';
import { EncounterRandomizer } from './EncounterRandomizer';
import { StatusChip } from './StatusChip';
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

    if (encounterRoll?.status === 'skipped') {
        return (
            <SkippedEncounterActions
                locationName={locationName}
                encounterActions={encounterActions}
            />
        );
    }

    const notRolled = encounterRoll?.status === 'notRolled';
    if (notRolled && encounters.length === 0) {
        return (
            <ConfirmSkipActions
                locationName={locationName}
                encounterActions={encounterActions}
            />
        );
    }

    const rolled = encounterRoll !== undefined && !notRolled;

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
                hasExistingRoll={rolled}
                disabled={encounterActions.isBusy}
                onPick={(pokemonName) =>
                    encounterActions.rollEncounter(pokemonName, locationName)
                }
            />
            {rolled && (
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

interface SkipActionProps {
    locationName: string;
    encounterActions: ReturnType<typeof useEncounterActions>;
}

function SkippedEncounterActions({
    locationName,
    encounterActions,
}: SkipActionProps) {
    return (
        <div className={actionRow}>
            <StatusChip status="skipped" />
            <p className={emptyPoolText}>No encounter available here.</p>
            <Button
                variant="secondary"
                ariaLabel="Undo skip"
                title="Undo skip"
                onClick={() =>
                    void encounterActions.clearEncounter(locationName)
                }
                disabled={encounterActions.isBusy}
            >
                Undo
            </Button>
        </div>
    );
}

function ConfirmSkipActions({
    locationName,
    encounterActions,
}: SkipActionProps) {
    return (
        <div className={actionRow}>
            <p className={emptyPoolText}>
                Every possible encounter here is banned or not allowed in this
                run.
            </p>
            <br />
            <Button
                variant="primary"
                onClick={() =>
                    void encounterActions.skipEncounter(locationName)
                }
                disabled={encounterActions.isBusy}
            >
                Confirm
            </Button>
        </div>
    );
}

const actionRow = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
`;

const emptyPoolText = css`
    margin: 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const pendingActionHighlight = css`
    &&& {
        border-color: var(--color-accent-warm);
    }
`;
