import type { CSSProperties } from 'react';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { getPokemonTypeColor } from '../../../../utils/pokemon-type-colors';
import { useBossBattleRosterQuery } from '../../queries';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossResultControls } from './BossResultControls';
import { BossHeader, BossRoster } from './BossRoster';
import { STARFALL_BOSS_ICON } from './boss-category-icons';
import { progressionCardPattern } from './progression-card-pattern';
import {
    applyStarmobileOverride,
    STARMOBILE_OVERRIDES,
} from './starmobile-overrides';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';

const LOCATION_NAME = 'North Province (Area Three)';
const DISPLAY_BATTLE_NAME = 'Eri (Team Star)';
const BATTLE_NAME = 'Eri (Fighting Star)';
const SPECIALTY_TYPE = 'Fighting';

interface EriFightingStarProps {
    isNext?: boolean;
}

export function EriFightingStar({ isNext }: EriFightingStarProps) {
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

    const rosterData = applyStarmobileOverride(
        rosterQuery.data,
        STARMOBILE_OVERRIDES[BATTLE_NAME],
    );
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
                    icon={STARFALL_BOSS_ICON}
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
                        icon={STARFALL_BOSS_ICON}
                        specialtyType={SPECIALTY_TYPE}
                    />
                    <ProgressionDescription>
                        Before facing Eri, you must defeat the trainer guarding
                        the Team Star base, who uses two pokemons at level 54
                        and 55 respectively.
                    </ProgressionDescription>
                    <BossResultControls
                        currentResult={currentResult}
                        onResolve={(result) =>
                            bossActions.resolveBattle(BATTLE_NAME, result)
                        }
                        onClear={() => bossActions.clearBattle(BATTLE_NAME)}
                        isBusy={bossActions.isBusy}
                    />
                    <BossRoster roster={rosterData} iconSize="lg" zoomedIcon />
                </>
            )}
        </ProgressionCard>
    );
}
