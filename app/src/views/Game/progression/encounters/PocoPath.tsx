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

const LOCATION_NAME = 'Poco Path';

interface PocoPathProps {
    isNext?: boolean;
}

export function PocoPath({ isNext }: PocoPathProps) {
    const game = useGame();
    const encountersQuery = useLocationEncounterCandidates(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [includeOcean, setIncludeOcean] = usePersistentGameState(
        game.id,
        'poco-path-include-ocean',
        false,
    );
    const [isTableExpanded, setTableExpanded] = useState(false);
    const encounterActions = useEncounterActions();

    if (encountersQuery.isPending) {
        return <p>Loading Poco Path encounters...</p>;
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
    const activeEncounters = filter(data.allEncounters, includeOcean);
    const rollableEncounters = filter(data.rollableEncounters, includeOcean);

    return (
        <ProgressionCard
            ariaLabelledBy="poco-path-heading"
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    areaName={encountersQuery.data.location.province}
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
                        encounters={activeEncounters}
                        canCollapse
                        onCollapse={collapse}
                    />

                    <Checkbox
                        label="Include ocean/beach encounters"
                        checked={includeOcean}
                        title="Beach encounters become accessible after the Naranja Academy (Scarlet) or Uva Academy (Violet) introduction and the first rival battle. You can save this encounter for later."
                        onChange={setIncludeOcean}
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
    includeOcean: boolean,
): LocationEncounterView[] {
    return includeOcean
        ? encounters
        : encounters.filter(
              (encounter) => !['Ocean', 'Beach'].includes(encounter.subArea),
          );
}
