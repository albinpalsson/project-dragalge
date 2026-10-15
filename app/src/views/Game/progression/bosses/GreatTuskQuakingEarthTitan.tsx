import type { CSSProperties } from 'react';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { getPokemonTypeColor } from '../../../../utils/pokemon-type-colors';
import { useBossBattleRosterQuery } from '../../queries';
import { useGame } from '../../../Game/GameContext';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossResultControls } from './BossResultControls';
import { BossHeader, BossRoster } from './BossRoster';
import { TITAN_BOSS_ICON } from './boss-category-icons';
import { progressionCardPattern } from './progression-card-pattern';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';

const LOCATION_NAME = 'Asado Desert';
const BATTLE_NAME = 'Great Tusk/Iron Treads (Quaking Earth Titan)';
const SPECIALTY_TYPE = 'Ground';

interface GreatTuskQuakingEarthTitanProps {
    isNext?: boolean;
}

export function GreatTuskQuakingEarthTitan({
    isNext,
}: GreatTuskQuakingEarthTitanProps) {
    const game = useGame();
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

    const variant = game.run.variant === 'v' ? 'Iron Treads' : 'Great Tusk';
    const displayBattleName = `${variant} (Quaking Earth Titan)`;

    const rosterData = {
        ...rosterQuery.data,
        pokemon: rosterQuery.data.pokemon.filter(
            (p) => p.pokemonName === variant,
        ),
    };
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
                    battleName={displayBattleName}
                    locationName={LOCATION_NAME}
                    result={currentResult}
                    levelCap={levelCap}
                    isNext={isNext}
                    onExpand={expand}
                    icon={TITAN_BOSS_ICON}
                    specialtyType={SPECIALTY_TYPE}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <BossHeader
                        locationName={LOCATION_NAME}
                        displayBattleName={displayBattleName}
                        levelCap={levelCap}
                        onCollapse={collapse}
                        currentResult={currentResult}
                        icon={TITAN_BOSS_ICON}
                        specialtyType={SPECIALTY_TYPE}
                    />
                    <ProgressionDescription>
                        This battle has two phases. First, you will face the
                        titan alone at its base strength. After defeating it,
                        you will face it again with{' '}
                        <strong>twice as much HP</strong>. Arven will join you
                        for the second phase with his Scovillain. Your Tera Orb
                        will recharge, and you can heal your Pokemon between
                        phases.
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
