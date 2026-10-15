import type { CSSProperties } from 'react';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { getPokemonTypeColor } from '../../../../utils/pokemon-type-colors';
import { useBossBattleRosterQuery } from '../../queries';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossResultControls } from './BossResultControls';
import { BossHeader, BossRoster } from './BossRoster';
import { GYM_BOSS_ICON } from './boss-category-icons';
import { progressionCardPattern } from './progression-card-pattern';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';

const LOCATION_NAME = 'Alfornada';
const DISPLAY_BATTLE_NAME = 'Tulip (Gym)';
const BATTLE_NAME = 'Tulip (Psychic Gym)';
const SPECIALTY_TYPE = 'Psychic';

interface TulipPsychicGymProps {
    isNext?: boolean;
}

export function TulipPsychicGym({ isNext }: TulipPsychicGymProps) {
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
                        The Alfornada gym test requires you to battle two
                        trainers with five Pokémon in total, all at level 43,
                        before you can face Tulip.
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
                        teraType="Psychic"
                        iconSize="lg"
                        zoomedIcon
                    />
                </>
            )}
        </ProgressionCard>
    );
}
