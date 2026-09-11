import { useState } from 'react';
import { Checkbox } from '../../../../components/Checkbox';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { useGame } from '../../GameContext';
import {
    useLocationEncountersQuery,
    useSetPocoPathOceanSettingMutation,
} from '../../queries';

const LOCATION_NAME = 'Poco Path';

export function PocoPath() {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const setOceanMutation = useSetPocoPathOceanSettingMutation();
    const [isExpanded, setExpanded] = useState(false);
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
    const oceanEncounters = allEncounters.filter(
        (encounter) => encounter.subArea === 'Ocean',
    );
    const activeEncounters = game.settings.pocoPathOcean
        ? allEncounters
        : allEncounters.filter((encounter) => encounter.subArea !== 'Ocean');

    return (
        <ProgressionCard
            dimmed={Boolean(encounterRoll)}
            ariaLabelledBy="poco-path-heading"
        >
            <EncounterHeader
                location={encountersQuery.data.location}
                encounters={activeEncounters}
            />

            {oceanEncounters.length > 0 && (
                <Checkbox
                    label="Include ocean encounters"
                    checked={game.settings.pocoPathOcean}
                    disabled={setOceanMutation.isPending}
                    onChange={(includeOcean) =>
                        setOceanMutation.mutate({
                            gameRunId: game.id,
                            includeOcean,
                        })
                    }
                />
            )}

            <RollResult encounterRoll={encounterRoll} />

            <RollActions
                locationName={LOCATION_NAME}
                encounters={activeEncounters}
            />

            <EncounterTableToggle
                expanded={isExpanded}
                onToggle={() => setExpanded((value) => !value)}
            />

            {isExpanded && (
                <EncounterTable
                    encounters={activeEncounters}
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
