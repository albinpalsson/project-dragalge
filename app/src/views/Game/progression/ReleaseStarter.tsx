import { css } from '@pokedb2/css-in-js';
import { Button } from '../../../components/Button';
import { ProgressionDescription } from '../../../components/ProgressionDescription';
import { ProgressionCard } from '../../../components/ProgressionCard';
import { StatusChip } from '../../../components/StatusChip';
import { STARTER_LOCATION_NAME } from '../../../db/game-db/queries';
import { useEncounterActions } from '../../../hooks/useEncounterActions';
import { useStarter } from '../../../hooks/useStarter';
import { useGame } from '../GameContext';

interface ReleaseStarterProps {
    isNext?: boolean;
}

export function ReleaseStarter({ isNext }: ReleaseStarterProps) {
    const game = useGame();
    const starter = useStarter();
    const encounterActions = useEncounterActions();
    const starterRow = game.encounters.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    );
    const starterStatus = starterRow?.status;
    const canRelease = starterStatus === 'caught';

    if (!starter || !starterRow) {
        return null;
    }

    return (
        <ProgressionCard isNext={isNext} compact>
            <div className={headingRow}>
                <h3 className={heading}>Release starter</h3>
                {starterStatus === 'released' && <StatusChip status="released" />}
            </div>
            {starterStatus === 'caught' && (
                <ProgressionDescription>
                    Press Release to mark starter released, which move it out of your team and box.
                </ProgressionDescription>
            )}
            {starterStatus !== 'released' && (
                <Button
                    className={compactControl}
                    variant="secondary"
                    disabled={!canRelease || encounterActions.isBusy}
                    onClick={() =>
                        void encounterActions.releaseStarter(
                            STARTER_LOCATION_NAME,
                        )
                    }
                >
                    Release {starter}
                </Button>
            )}
        </ProgressionCard>
    );
}

const heading = css`
    margin: 0;
    font: inherit;
    font-weight: var(--font-weight-bold);
`;

const headingRow = css`
    display: flex;
    justify-content: flex-start;
    align-items: center;
    gap: var(--space-2);
`;

const compactControl = css`
    align-self: flex-start;
`;
