import { css } from '@project-dragalge/css-in-js';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ProgressionCardHeader } from '../../../../components/ProgressionCardHeader';
import { useBossBattleRosterQuery } from '../../queries';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { BossRoster } from '../bosses/BossRoster';
import { StrongTrainerIdentity } from './StrongTrainerIdentity';

const BATTLE_NAME = 'Arven';
const LOCATION_NAME = 'Poco Path';
const DISPLAY_NAME = `${BATTLE_NAME} - Poco Path lighthouse`;

export function ArvenFirstBattle() {
    const rosterQuery = useBossBattleRosterQuery(BATTLE_NAME);

    if (rosterQuery.isPending) {
        return <p>Loading {BATTLE_NAME}'s roster...</p>;
    }
    if (rosterQuery.isError) {
        return (
            <p>
                Error loading {BATTLE_NAME}'s roster:{' '}
                {rosterQuery.error.message}
            </p>
        );
    }
    if (!rosterQuery.data) {
        return <p>Unable to load {BATTLE_NAME} roster</p>;
    }
    const roster = rosterQuery.data;

    return (
        <ProgressionCard
            compact
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <CollapsedSummaryRow
                    className={collapsedSummary}
                    icon={null}
                    title={DISPLAY_NAME}
                    onExpand={expand}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <ProgressionCardHeader
                        onCollapse={collapse}
                        collapseLabel="Collapse Arven fight"
                    >
                        <StrongTrainerIdentity
                            displayName={DISPLAY_NAME}
                            locationName={LOCATION_NAME}
                        />
                    </ProgressionCardHeader>
                    <ProgressionDescription>
                        Arven will battle you when you reach the lighthouse at
                        the end of Poco Path. This battle is typically an easy
                        win using the starter Pokémon, but since this run is
                        set to release it, extra caution is required.
                    </ProgressionDescription>
                    <BossRoster roster={roster} iconSize="lg" zoomedIcon />
                </>
            )}
        </ProgressionCard>
    );
}

const collapsedSummary = css`
    && {
        color: var(--color-text-muted);
    }
`;
