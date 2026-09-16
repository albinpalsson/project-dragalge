import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
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
import { useLocationEncountersQuery } from '../../queries';

const LOCATION_NAME = 'Inlet Grotto';

interface InletGrottoProps {
    isNext?: boolean;
}

export function InletGrotto({ isNext }: InletGrottoProps) {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
    const [isTableExpanded, setTableExpanded] = useState(false);
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
    const rollableEncounters = filterEncountersForVariant(
        encountersQuery.data.encounters,
        game.run.variant,
    );

    return (
        <ProgressionCard
            ariaLabelledBy="inlet-grotto-heading"
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    areaName={encountersQuery.data.location.province}
                    locationName={LOCATION_NAME}
                    encounterRoll={encounterRoll}
                    encounters={encountersQuery.data.encounters}
                    isNext={isNext}
                    onExpand={expand}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <EncounterHeader
                        location={encountersQuery.data.location}
                        encounters={encountersQuery.data.encounters}
                        canCollapse
                        onCollapse={collapse}
                    />

                    <RollResult encounterRoll={encounterRoll} />

                    {showHoundourWarning && (
                        <p className={warning}>
                            Houndour is first available in Inlet Grotto after
                            finishing the Naranja Academy introduction, which is
                            after the first rival battle, when the level cap is
                            increased above 9. Re-rolling for the early
                            encounter pickup is valid.
                        </p>
                    )}

                    <RollActions
                        locationName={LOCATION_NAME}
                        encounters={rollableEncounters}
                    />

                    <EncounterTableToggle
                        expanded={isTableExpanded}
                        count={encountersQuery.data.encounters.length}
                        onToggle={() => setTableExpanded((value) => !value)}
                    />

                    {isTableExpanded && (
                        <EncounterTable
                            encounters={encountersQuery.data.encounters}
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

const warning = css`
  margin: 0;
  padding: var(--space-2) var(--space-3);
  border-left: 0.3rem solid var(--color-primary);
  color: var(--color-text-secondary);
`;
