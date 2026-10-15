import type { CSSProperties } from 'react';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { useBossActions } from '../../../../hooks/useBossActions';
import { getPokemonTypeColor } from '../../../../utils/pokemon-type-colors';
import { useBossBattleRosterQuery } from '../../queries';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossHeader, BossRoster } from './BossRoster';
import { BossResultControls } from './BossResultControls';
import { GYM_BOSS_ICON } from './boss-category-icons';
import { progressionCardPattern } from './progression-card-pattern';

const LOCATION_NAME = 'Artazon';
const DISPLAY_BATTLE_NAME = 'Brassius (Gym)';
const BATTLE_NAME = 'Brassius (Grass Gym)';
const SPECIALTY_TYPE = 'Grass';

interface BrassiusGrassGymProps {
    isNext?: boolean;
}

export function BrassiusGrassGym({ isNext }: BrassiusGrassGymProps) {
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
        <ProgressionCard
            className={progressionCardPattern}
            style={
                {
                    '--progression-card-pattern-color':
                        getPokemonTypeColor(SPECIALTY_TYPE),
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
                    icon={GYM_BOSS_ICON}
                    specialtyType={SPECIALTY_TYPE}
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
                        icon={GYM_BOSS_ICON}
                        specialtyType={SPECIALTY_TYPE}
                    />
                    <ProgressionDescription>
                        The Sunflora Hide-and-Seek gym tests makes you fight a
                        few (less than 5) Sunflora of levels 12-14. Be wary of
                        the level cap.
                    </ProgressionDescription>
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
                        teraType="Grass"
                        iconSize="lg"
                        zoomedIcon
                    />
                </>
            )}
        </ProgressionCard>
    );
}
