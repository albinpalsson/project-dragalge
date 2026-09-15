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
import { filterEncountersForVariant } from '../../../../utils/game-variant';
import { useGame } from '../../GameContext';
import {
    useLocationEncountersQuery,
    useSetPocoPathOceanSettingMutation,
} from '../../queries';

const LOCATION_NAME = 'Poco Path';

interface PocoPathProps {
    isNext?: boolean;
}

export function PocoPath({ isNext }: PocoPathProps) {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const setOceanMutation = useSetPocoPathOceanSettingMutation();
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

    const allEncounters = encountersQuery.data.encounters;
    const activeEncounters = game.settings.pocoPathOcean
        ? allEncounters
        : allEncounters.filter(
              (encounter) => !['Ocean', 'Beach'].includes(encounter.subArea),
          );
    const rollableEncounters = filterEncountersForVariant(
        activeEncounters,
        game.run.variant,
    );

    return (
        <ProgressionCard
            ariaLabelledBy="poco-path-heading"
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    locationName={LOCATION_NAME}
                    encounterRoll={encounterRoll}
                    encounters={activeEncounters}
                    isNext={isNext}
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
                        checked={game.settings.pocoPathOcean}
                        disabled={setOceanMutation.isPending}
                        title="Beach area encounters are first accessible after finishing the Naranja Academy introduction, after the first rival battle, you may save this encounter for later."
                        onChange={(includeOcean) =>
                            setOceanMutation.mutate({
                                gameRunId: game.id,
                                includeOcean,
                            })
                        }
                    />

                    <RollResult encounterRoll={encounterRoll} />

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
