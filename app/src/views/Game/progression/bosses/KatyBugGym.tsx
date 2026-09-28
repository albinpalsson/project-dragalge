import type { CSSProperties } from 'react';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossHeader, BossRoster } from './BossRoster';
import { BossResultControls } from './BossResultControls';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { getPokemonTypeColor } from '../../../../utils/pokemon-type-colors';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useBossBattleRosterQuery } from '../../queries';
import { progressionCardPattern } from './progression-card-pattern';

const LOCATION_NAME = 'Cortondo';
const DISPLAY_BATTLE_NAME = 'Katy (Gym)';
const BATTLE_NAME = 'Katy (Bug Gym)';
const GYM_ICON = '🏅';
const TERA_ACE = { pokemonName: 'Teddiursa', teraType: 'Bug' };

interface KatyBugGymProps {
    isNext?: boolean;
}

export function KatyBugGym({ isNext }: KatyBugGymProps) {
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
            style={{ '--progression-card-pattern-color': getPokemonTypeColor('Bug') } as CSSProperties}
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
                    icon={GYM_ICON}
                    specialtyType="Bug"
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
                        icon={GYM_ICON}
                        specialtyType="Bug"
                    />
                    <ProgressionDescription>
                        The Olive Roll gym challenge contains 0–2 optional
                        trainer battles with 0–2 Pokemon in total before you
                        can face Katy.
                    </ProgressionDescription>
                    <BossResultControls
                        currentResult={currentResult}
                        onResolve={(result) =>
                            bossActions.resolveBattle(BATTLE_NAME, result)
                        }
                        onClear={() => bossActions.clearBattle(BATTLE_NAME)}
                        isBusy={bossActions.isBusy}
                    />
                    <BossRoster roster={rosterData} teraAce={TERA_ACE} />
                </>
            )}
        </ProgressionCard>
    );
}

