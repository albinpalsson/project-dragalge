import { css } from '@pokedb2/css-in-js';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossHeader, BossRoster } from './BossRoster';
import { BossResultControls } from './BossResultControls';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useStarter } from '../../../../hooks/useStarter';
import { getStarterBattleName } from '../../../../db/pokemon-data/starter-battles';
import { STARTER_NAMES } from '../../../Game/StarterCard';
import { useBossBattleRosterQuery } from '../../queries';

const LOCATION_NAME = 'South Province (Area One)';
const DISPLAY_BATTLE_NAME = 'Nemona (Second Battle)';

interface NemonaSouthProvinceProps {
    isNext?: boolean;
}

export function NemonaSouthProvince({ isNext }: NemonaSouthProvinceProps) {
    const bossActions = useBossActions();
    const starter = useStarter();
    const displayStarter = starter ?? STARTER_NAMES[0];
    const battleName = getStarterBattleName(displayStarter);
    const rosterQuery = useBossBattleRosterQuery(battleName);
    const currentResult = bossActions.getBattleResult(battleName);

    if (rosterQuery.isPending) {
        return <p>Loading {LOCATION_NAME} roster...</p>;
    }

    if (rosterQuery.isError) {
        return (
            <p>
                Error loading {LOCATION_NAME} roster:{' '}
                {rosterQuery.error.message}
            </p>
        );
    }

    if (!rosterQuery.data) {
        return <p>Unable to load {battleName} roster</p>;
    }

    const rosterData = rosterQuery.data;

    const levelCap = Math.max(
        ...rosterData.pokemon.map((pokemon) => pokemon.level),
    );
    return (
        <ProgressionCard
            className={bossAccent}
            compact
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <BossCollapsedSummary
                    battleName={DISPLAY_BATTLE_NAME}
                    locationName={LOCATION_NAME}
                    result={currentResult}
                    levelCap={levelCap}
                    isNext={isNext}
                    onExpand={expand}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <BossHeader
                        locationName={LOCATION_NAME}
                        displayBattleName={DISPLAY_BATTLE_NAME}
                        levelCap={levelCap}
                        onCollapse={collapse}
                        currentResult={currentResult}
                    />
                    <p className={description}>
                        This battle begins at the large door between South
                        Province (Area One) and Naranja Academy, beside the
                        Pokemon Center.
                    </p>
                    <BossResultControls
                        currentResult={currentResult}
                        onResolve={(result) =>
                            bossActions.resolveBattle(battleName, result)
                        }
                        onClear={() => bossActions.clearBattle(battleName)}
                        isBusy={bossActions.isBusy}
                    />
                    <BossRoster roster={rosterData} />
                </>
            )}
        </ProgressionCard>
    );
}

const bossAccent = css`
    && {
        border-color: var(--color-border);
        border-left: 0.4rem solid var(--color-accent-warm);
        box-shadow: none;
    }
`;

const description = css`
    max-width: 46rem;
    margin: 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    padding-top: var(--space-1);
    padding-bottom: var(--space-1);
`;
