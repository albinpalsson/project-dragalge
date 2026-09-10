import { useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { EncounterHeader } from '../../../../components/EncounterHeader';
import { EncounterTable } from '../../../../components/EncounterTable';
import { EncounterTableToggle } from '../../../../components/EncounterTableToggle';
import { RollActions } from '../../../../components/RollActions';
import { RollResult } from '../../../../components/RollResult';
import { useEncounterRoll } from '../../../../hooks/useEncounterRoll';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { useLocationEncountersQuery } from '../../queries';

const LOCATION_NAME = 'Inlet Grotto';

export function InletGrotto() {
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [isExpanded, setExpanded] = useState(false);
    const encounterActions = useEncounterActions();

    if (encountersQuery.isPending) {
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

    const showHoundourWarning = encounterRoll?.name === 'Houndour';

    return (
        <article
            className={cx(card, encounterRoll && resolvedCard)}
            aria-labelledby="inlet-grotto-heading"
        >
            <EncounterHeader
                location={encountersQuery.data.location}
                encounters={encountersQuery.data.encounters}
            />

            <RollResult encounterRoll={encounterRoll} />

            {showHoundourWarning && (
                <p className={warning}>
                    Houndour is first available in Inlet Grotto after finishing
                    the Naranja Academy introduction, which is after the first
                    rival battle, when the level cap is increased above 9.
                    Re-rolling for the early encounter pickup is valid.
                </p>
            )}

            <RollActions
                locationName={LOCATION_NAME}
                encounters={encountersQuery.data.encounters}
            />

            <EncounterTableToggle
                expanded={isExpanded}
                onToggle={() => setExpanded((value) => !value)}
            />

            {isExpanded && (
                <EncounterTable
                    encounters={encountersQuery.data.encounters}
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

const warning = css`
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-left: 0.3rem solid var(--color-primary);
  color: var(--color-text-muted);
`;
