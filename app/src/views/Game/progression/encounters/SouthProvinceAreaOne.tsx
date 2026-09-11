import { useState } from 'react';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { useLocationEncountersQuery } from '../../queries';

const LOCATION_NAME = 'South Province (Area One)';

export function SouthProvinceAreaOne() {
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [isExpanded, setExpanded] = useState(false);
    const encounterActions = useEncounterActions();

    if (encountersQuery.isPending) {
        return <p>Loading South Province (Area One) encounters...</p>;
    }

    if (encountersQuery.isError) {
        return (
            <p>
                Error loading {LOCATION_NAME} encounters:{' '}
                {encountersQuery.error.message}
            </p>
        );
    }

    const allEncounters = encountersQuery.data.encounters;

    return (
        <ProgressionCard
            compact
            dimmed={Boolean(encounterRoll)}
            ariaLabelledBy="south-province-area-one-heading"
        >
            <EncounterHeader
                location={encountersQuery.data.location}
                encounters={allEncounters}
            />

            <RollResult encounterRoll={encounterRoll} />

            <RollActions
                locationName={LOCATION_NAME}
                encounters={allEncounters}
            />

            <EncounterTableToggle
                expanded={isExpanded}
                onToggle={() => setExpanded((value) => !value)}
            />

            {isExpanded && (
                <EncounterTable
                    encounters={allEncounters}
                    disabled={
                        encounterActions.isBusy || encounterRoll !== undefined
                    }
                    onPick={(encounter) =>
                        encounterActions.rollEncounter(
                            encounter.name,
                            LOCATION_NAME,
                        )
                    }
                />
            )}
        </ProgressionCard>
    );
}
