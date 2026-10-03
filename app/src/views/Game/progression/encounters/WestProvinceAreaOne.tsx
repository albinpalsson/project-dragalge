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
import { filterEncountersForVariant } from '../../../../utils/game-variant';
import { useGame } from '../../GameContext';
import { useLocationEncountersQuery } from '../../queries';

const LOCATION_NAME = 'West Province (Area One)';

interface WestProvinceAreaOneProps {
    isNext?: boolean;
}

export function WestProvinceAreaOne({ isNext }: WestProvinceAreaOneProps) {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [excludeOcean, setExcludeOcean] = usePersistentGameState(
        game.id,
        'west-province-area-one-exclude-ocean',
        false,
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

    const allEncounters = encountersQuery.data.encounters;
    const activeEncounters = excludeOcean
        ? allEncounters.filter((encounter) => encounter.subArea !== 'Ocean')
        : allEncounters;
    const rollableEncounters = filterEncountersForVariant(
        activeEncounters,
        game.run.variant,
    );

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            ariaLabelledBy="west-province-area-one-heading"
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
                        label="Include ocean encounters"
                        checked={!excludeOcean}
                        title="Ocean encounters are first accessible after defeating the Open Sky titan."
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
                            variant={game.run.variant}
                            disabled={encounterActions.isBusy}
                            onPick={(encounter) =>
                                encounterActions.rollEncounter(
                                    encounter.name,
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
