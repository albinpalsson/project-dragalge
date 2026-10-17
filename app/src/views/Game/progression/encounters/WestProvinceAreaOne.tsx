import { useState } from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { EncounterCollapsedSummary } from '../../../../components/EncounterCollapsedSummary';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { usePersistentGameState } from '../../../../hooks/usePersistentGameState';
import type { LocationEncounterView } from '../../../../db/pokemon-data/queries';
import { useGame } from '../../GameContext';
import { useLocationEncounterCandidates } from '../../queries';

const LOCATION_NAME = 'West Province (Area One)';

interface WestProvinceAreaOneProps {
    isNext?: boolean;
}

export function WestProvinceAreaOne({ isNext }: WestProvinceAreaOneProps) {
    const game = useGame();
    const encountersQuery = useLocationEncounterCandidates(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [excludeOcean, setExcludeOcean] = usePersistentGameState(
        game.id,
        'west-province-area-one-exclude-ocean',
        true,
    );
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

    const { data } = encountersQuery;
    const activeEncounters = filter(data.allEncounters, excludeOcean);
    const rollableEncounters = filter(data.rollableEncounters, excludeOcean);

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            ariaLabelledBy="west-province-area-one-heading"
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    locationName={LOCATION_NAME}
                    encounterRoll={encounterRoll}
                    encounters={activeEncounters}
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
                        encounters={activeEncounters}
                        canCollapse
                        onCollapse={collapse}
                    />
                    <Checkbox
                        label="Include ocean encounters"
                        checked={!excludeOcean}
                        title="Ocean encounters become accessible after you defeat the Open Sky Titan."
                        onChange={(value) => setExcludeOcean(!value)}
                    />
                    <RollResult encounterRoll={encounterRoll} zoomedIcon />
                    <RollActions
                        locationName={LOCATION_NAME}
                        encounters={rollableEncounters}
                    />
                    <EncounterTableToggle
                        expanded={isTableExpanded}
                        count={activeEncounters.length}
                        onToggle={() => setTableExpanded((value) => !value)}
                    />
                    {isTableExpanded && (
                        <EncounterTable
                            encounters={activeEncounters}
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

function filter(
    encounters: LocationEncounterView[],
    excludeOcean: boolean,
): LocationEncounterView[] {
    return excludeOcean
        ? encounters.filter((encounter) => encounter.subArea !== 'Ocean')
        : encounters;
}
