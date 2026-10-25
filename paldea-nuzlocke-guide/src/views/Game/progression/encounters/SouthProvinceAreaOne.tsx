import { useState } from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { EncounterCollapsedSummary } from '../../../../components/EncounterCollapsedSummary';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { usePersistentGameState } from '../../../../hooks/usePersistentGameState';
import type { LocationEncounterView } from '../../../../db/pokemon-data/queries';
import { useGame } from '../../GameContext';
import { useLocationEncounterCandidates } from '../../queries';
import { formatLocationName } from '../../../../utils/encounter-formatters';

const LOCATION_NAME = 'South Province (Area One)';

interface SouthProvinceAreaOneProps {
    isNext?: boolean;
}

export function SouthProvinceAreaOne({ isNext }: SouthProvinceAreaOneProps) {
    const game = useGame();
    const encountersQuery = useLocationEncounterCandidates(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [includeOcean, setIncludeOcean] = usePersistentGameState(
        game.name,
        'SPA1-include-ocean-underwater',
        false,
    );
    const [isTableExpanded, setTableExpanded] = useState(false);
    const encounterActions = useEncounterActions();

    if (encountersQuery.isPending) {
        return <p>Loading {formatLocationName(LOCATION_NAME)} encounters...</p>;
    }

    if (encountersQuery.isError) {
        return (
            <p>
                Error loading {formatLocationName(LOCATION_NAME)} encounters:{' '}
                {encountersQuery.error.message}
            </p>
        );
    }

    const { allEncounters, rollableEncounters } = encountersQuery.data;
    const activeEncounters = filter(allEncounters, includeOcean);
    const activeRollableEncounters = filter(rollableEncounters, includeOcean);

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            ariaLabelledBy="south-province-area-one-heading"
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
                        label="Include ocean/underwater encounters"
                        checked={includeOcean}
                        title="Ocean and underwater encounters become accessible after you defeat the Open Sky Titan."
                        onChange={setIncludeOcean}
                    />

                    <RollResult encounterRoll={encounterRoll} zoomedIcon />

                    <RollActions
                        locationName={LOCATION_NAME}
                        encounters={activeRollableEncounters}
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
    includeOcean: boolean,
): LocationEncounterView[] {
    return includeOcean
        ? encounters
        : encounters.filter(
              (encounter) =>
                  encounter.subArea !== 'Ocean' &&
                  encounter.terrain !== 'underwater',
          );
}
