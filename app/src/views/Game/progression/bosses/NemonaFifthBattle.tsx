import type { CSSProperties } from 'react';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { getNemonaBattleName } from '../../../../db/pokemon-data/starter-battles';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useStarter } from '../../../../hooks/useStarter';
import {
    getNemonaStarterChoice,
    STARTER_NAMES,
} from '../../../../utils/starter-choices';
import { useBossBattleRosterQuery } from '../../queries';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossResultControls } from './BossResultControls';
import { BossHeader, BossRoster } from './BossRoster';
import { progressionCardPattern } from './progression-card-pattern';

const LOCATION_NAME = 'Alfornada';
const DISPLAY_BATTLE_NAME = 'Nemona (Fifth rival battle)';

interface NemonaFifthBattleProps {
    isNext?: boolean;
}

export function NemonaFifthBattle({ isNext }: NemonaFifthBattleProps) {
    const bossActions = useBossActions();
    const starter = useStarter();
    const displayStarter = starter ?? STARTER_NAMES[0];
    const battleName = getNemonaBattleName(displayStarter, 'Fifth');
    const rosterQuery = useBossBattleRosterQuery(battleName);
    const currentResult = bossActions.getBattleResult(battleName);
    const teraType = getNemonaStarterChoice(displayStarter).type;

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
                        Nemona will challenge you when you enter the Alfornada
                        Gym.
                    </ProgressionDescription>
                    <BossResultControls
                        currentResult={currentResult}
                        onResolve={(result) =>
                            bossActions.resolveBattle(battleName, result)
                        }
                        onClear={() => bossActions.clearBattle(battleName)}
                        isBusy={bossActions.isBusy}
                    />
                    <BossRoster
                        roster={rosterData}
                        teraType={teraType}
                        iconSize="lg"
                        zoomedIcon
                    />
                </>
            )}
        </ProgressionCard>
    );
}
