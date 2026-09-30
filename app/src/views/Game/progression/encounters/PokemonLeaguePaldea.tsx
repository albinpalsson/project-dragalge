import { useState } from 'react';
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
import { ProgressionDescription } from '../../../../components/ProgressionDescription';

const LOCATION_NAME = 'Pokemon League (Paldea)';

interface PokemonLeaguePaldeaProps {
    isNext?: boolean;
}

export function PokemonLeaguePaldea({ isNext }: PokemonLeaguePaldeaProps) {
    const game = useGame();
    const encountersQuery = useLocationEncountersQuery(LOCATION_NAME);
    const encounterRoll = useEncounterRoll(LOCATION_NAME);
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
    const rollableEncounters = filterEncountersForVariant(
        allEncounters,
        game.run.variant,
    );

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            ariaLabelledBy="pokemon-league-paldea-heading"
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <EncounterCollapsedSummary
                    areaName={encountersQuery.data.location.province}
                    locationName={LOCATION_NAME}
                    encounterRoll={encounterRoll}
                    encounters={allEncounters}
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
                        encounters={allEncounters}
                        canCollapse
                        onCollapse={collapse}
                    />

                    <RollResult encounterRoll={encounterRoll} zoomedIcon />

                    <RollActions
                        locationName={LOCATION_NAME}
                        encounters={rollableEncounters}
                    />

                    <ProgressionDescription>
                        Located on a hill next to Naranja Academy (Scarlet) or Uva Academy (Violet) and accessible from northwest of Mesagoza.
                    </ProgressionDescription>

                    <EncounterTableToggle
                        expanded={isTableExpanded}
                        count={allEncounters.length}
                        onToggle={() => setTableExpanded((value) => !value)}
                    />

                    {isTableExpanded && (
                        <EncounterTable
                            encounters={allEncounters}
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
