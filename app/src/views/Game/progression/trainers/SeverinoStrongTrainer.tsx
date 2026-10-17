import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../../../components/Badge';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ProgressionCardHeader } from '../../../../components/ProgressionCardHeader';
import { useBossBattleRosterQuery } from '../../queries';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { BossRoster } from '../bosses/BossRoster';
import { StrongTrainerIdentity } from './StrongTrainerIdentity';

const BATTLE_NAME = 'Severino the Office Worker';
const LOCATION_NAME = 'South Province (Area Three)';
const DISPLAY_NAME = `Strong trainer - ${BATTLE_NAME}`;

export function SeverinoStrongTrainer() {
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
                        <StrongTrainerIdentity
                            displayName={DISPLAY_NAME}
                            locationName={LOCATION_NAME}
                        />
                    </ProgressionCardHeader>
                    <ProgressionDescription>
                        You can find Severino close to the Pokémon Center in
                        South Province (A3). <br />
                        Consider stealing the Leftovers item from his Skiddo.
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
