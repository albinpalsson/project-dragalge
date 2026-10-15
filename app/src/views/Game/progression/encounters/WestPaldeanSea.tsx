import { useState } from 'react';
import { EncounterCollapsedSummary } from '../../../../components/EncounterCollapsedSummary';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useLocationEncounterCandidates } from '../../queries';

const LOCATION_NAME = 'West Paldean Sea';

interface WestPaldeanSeaProps {
    isNext?: boolean;
}

export function WestPaldeanSea({ isNext }: WestPaldeanSeaProps) {
    const encountersQuery = useLocationEncounterCandidates(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [isTableExpanded, setTableExpanded] = useState(false);
    const encounterActions = useEncounterActions();

    if (encountersQuery.isPending) {
        return <p>Loading {LOCATION_NAME} encounters...</p>;
    }

    if (encountersQuery.isError) {
        return (
            <p>
                Error loading {LOCATION_NAME} encounters:{' '}
                {encountersQuery.error.message}
            </p>
        );
    }

    const { allEncounters, rollableEncounters } = encountersQuery.data;

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            ariaLabelledBy="west-paldean-sea-heading"
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    areaName={encountersQuery.data.location.province}
                    locationName={LOCATION_NAME}
                    encounterRoll={encounterRoll}
                    encounters={allEncounters}
                    isNext={isNext}
                    onExpand={expand}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <EncounterHeader
                        location={encountersQuery.data.location}
                        encounters={allEncounters}
                        canCollapse
                        onCollapse={collapse}
                    />
                    <RollResult encounterRoll={encounterRoll} />
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
