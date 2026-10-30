import type { CSSProperties } from 'react';
import { FINAL_BATTLE_NAME } from '../../../../db/game-db/queries';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ChampionCompleteInterstitial } from './ChampionCompleteInterstitial';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useBossBattleRosterQuery } from '../../queries';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossResultControls } from './BossResultControls';
import { BossHeader, BossRoster } from './BossRoster';
import { ELITE_FOUR_BOSS_ICON } from './boss-category-icons';
import { progressionCardPattern } from './progression-card-pattern';

const LOCATION_NAME = 'Pokemon League';
const DISPLAY_BATTLE_NAME = FINAL_BATTLE_NAME;
const BATTLE_NAME = FINAL_BATTLE_NAME;

interface GeetaTopChampionProps {
    isNext?: boolean;
}

export function GeetaTopChampion({ isNext }: GeetaTopChampionProps) {
    const bossActions = useBossActions();
    const rosterQuery = useBossBattleRosterQuery(BATTLE_NAME);
    const currentResult = bossActions.getBattleResult(BATTLE_NAME);

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
        return <p>Unable to load {BATTLE_NAME} roster</p>;
    }

    const rosterData = rosterQuery.data;
    const levelCap = Math.max(
        ...rosterData.pokemon.map((pokemon) => pokemon.level),
    );

    return (
        <>
            <ProgressionCard
                className={progressionCardPattern}
                style={
                    {
                        '--progression-card-pattern-color':
                            'var(--color-accent-warm)',
                    } as CSSProperties
                }
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
                        icon={ELITE_FOUR_BOSS_ICON}
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
                            icon={ELITE_FOUR_BOSS_ICON}
                        />
                        <BossResultControls
                            currentResult={currentResult}
                            onResolve={(result) =>
                                bossActions.resolveBattle(BATTLE_NAME, result)
                            }
                            onClear={() => bossActions.clearBattle(BATTLE_NAME)}
                            isBusy={bossActions.isBusy}
                        />
                        <BossRoster
                            roster={rosterData}
                            teraType="Rock"
                            iconSize="lg"
                            zoomedIcon
                        />
                    </>
                )}
            </ProgressionCard>
            <ChampionCompleteInterstitial />
        </>
    );
}
