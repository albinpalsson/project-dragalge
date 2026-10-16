import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../../../components/Badge';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ProgressionCardHeader } from '../../../../components/ProgressionCardHeader';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { useBossBattleRosterQuery } from '../../queries';
import { BossRoster } from '../bosses/BossRoster';

const BATTLE_NAME = 'Waitress Sofia';
const LOCATION_NAME = 'South Province (Area Five)';
const DISPLAY_NAME = `Strong trainer - ${BATTLE_NAME}`;

export function SofiaStrongTrainer() {
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
                        actions={
                            <BadgeButton
                                onClick={collapse}
                                ariaLabel="Collapse strong trainer fight"
                                title="Collapse strong trainer fight"
                            >
                                ▾ Fold
                            </BadgeButton>
                        }
                    >
                        <div>
                            <div className={titleRow}>
                                <h3 className={title}>{DISPLAY_NAME}</h3>
                            </div>
                            <p className={locationText}>{LOCATION_NAME}</p>
                        </div>
                    </ProgressionCardHeader>
                    <ProgressionDescription>
                        Sofia can be found along the beach near the Pokémon
                        Center in South Province (Area Five).
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

const titleRow = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
`;

const title = css`
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
`;

const locationText = css`
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;
