import { useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { Checkbox } from '../../../../components/Checkbox';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useEncounterRollActions } from '../../../../hooks/useEncounterRollActions';
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
    const rollActions = useEncounterRollActions(LOCATION_NAME);

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
        <article
            className={cx(card, encounterRoll && resolvedCard)}
            aria-labelledby="poco-path-heading"
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
                    disabled={rollActions.isBusy || encounterRoll !== undefined}
                    onPick={rollActions.pickEncounter}
                />
            )}
        </article>
    );
}

const card = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const resolvedCard = css`
  && {
    opacity: 0.6;
  }
`;
