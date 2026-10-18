import { useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { EncounterCollapsedSummary } from '../../../../components/EncounterCollapsedSummary';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { useLocationEncounterCandidates } from '../../queries';

const LOCATION_NAME = 'Inlet Grotto';

interface InletGrottoProps {
    isNext?: boolean;
}

export function InletGrotto({ isNext }: InletGrottoProps) {
    const encountersQuery = useLocationEncounterCandidates(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [isTableExpanded, setTableExpanded] = useState(false);
    const encounterActions = useEncounterActions();

    if (encountersQuery.isPending || encounterRoll === undefined) {
        return <p>Loading Inlet Grotto encounters...</p>;
    }

    if (encountersQuery.isError) {
        return (
            <p>
                Error loading Inlet Grotto encounters:{' '}
                {encountersQuery.error.message}
            </p>
        );
    }

    const showHoundourWarning =
        encounterRoll.status !== 'notRolled' &&
        encounterRoll.status !== 'skipped' &&
        encounterRoll.name === 'Houndour';
    const { allEncounters, rollableEncounters } = encountersQuery.data;

    return (
        <ProgressionCard
            ariaLabelledBy="inlet-grotto-heading"
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    locationName={LOCATION_NAME}
                    encounterRoll={encounterRoll}
                    encounters={allEncounters}
                    isNext={isNext}
                    zoomedIcon
                    onExpand={expand}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <EncounterHeader
                        location={encountersQuery.data.location}
                        encounterRoll={encounterRoll}
                        encounters={allEncounters}
                        canCollapse
                        onCollapse={collapse}
                    />

                    <RollResult encounterRoll={encounterRoll} zoomedIcon />

                    {showHoundourWarning && (
                        <ProgressionDescription className={warning}>
                            Houndour becomes available in Inlet Grotto after the
                            Naranja Academy (Scarlet) or Uva Academy (Violet)
                            introduction and the first rival battle, once the
                            level cap rises above 9. You can reroll this
                            encounter for an early pickup.
                        </ProgressionDescription>
                    )}

                    <RollActions
                        locationName={LOCATION_NAME}
                        encounters={rollableEncounters}
                    />

                    <EncounterTableToggle
                        expanded={isTableExpanded}
                        count={allEncounters.length}
                        onToggle={() => setTableExpanded((value) => !value)}
                    />

                    {isTableExpanded && (
                        <EncounterTable
                            encounters={allEncounters}
                            disabled={encounterActions.isBusy}
                            onPick={(pokemonName) =>
                                encounterActions.rollEncounter(
                                    pokemonName,
                                    LOCATION_NAME,
                                )
                            }
                        />
                    )}
                </>
            )}
        </ProgressionCard>
    );
}

const warning = css`
    border-left: 0.3rem solid var(--color-warning);
    padding-left: var(--space-3);
`;
