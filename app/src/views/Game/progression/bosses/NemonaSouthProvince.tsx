import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossHeader, BossRoster } from './BossRoster';
import { BossResultControls } from './BossResultControls';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useStarter } from '../../../../hooks/useStarter';
import { getStarterBattleName } from '../../../../db/pokemon-data/starter-battles';
import { STARTER_NAMES } from '../../../Game/StarterCard';
import { useBossBattleRosterQuery } from '../../queries';
import type { CSSProperties } from 'react';
import { progressionCardPattern } from './progression-card-pattern';

const LOCATION_NAME = 'South Province (Area One)';
const DISPLAY_BATTLE_NAME = 'Nemona (Second rival battle)';
const TERA_ACE = { pokemonName: 'Pawmi', teraType: 'Electric' };

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
            className={progressionCardPattern}
            style={{ '--progression-card-pattern-color': 'var(--color-accent-warm)' } as CSSProperties}
            compact
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <BossCollapsedSummary
                    className={progressionCardPattern}
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
                    <ProgressionDescription>
                        This battle begins at the large door between South
                        Province (Area One) and Mesagoza, beside the
                        Pokemon Center.
                    </ProgressionDescription>
                    <BossResultControls
                        currentResult={currentResult}
                        onResolve={(result) =>
                            bossActions.resolveBattle(battleName, result)
                        }
                        onClear={() => bossActions.clearBattle(battleName)}
                        isBusy={bossActions.isBusy}
                    />
                    <BossRoster roster={rosterData} teraAce={TERA_ACE} />
                </>
            )}
        </ProgressionCard>
    );
}

