import { useState } from 'react';
import { BossCollapsedSummary } from './BossCollapsedSummary';
import { BossRoster } from './BossRoster';
import { BossResultControls } from './BossResultControls';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useStarter } from '../../../../hooks/useStarter';
import { getStarterBattleName } from '../../../../db/pokemon-data/starter-battles';
import { useBossBattleRosterQuery } from '../../queries';

const LOCATION_NAME = 'South Province (Area One)';

interface NemonaSouthProvinceProps {
    isNext?: boolean;
}

export function NemonaSouthProvince({ isNext }: NemonaSouthProvinceProps) {
    const bossActions = useBossActions();
    const starter = useStarter();
    const starterBattleName = starter
        ? getStarterBattleName(starter)
        : undefined;
    const [showTeam, setShowTeam] = useState(true);

    const rosterQuery = useBossBattleRosterQuery(
        starterBattleName || 'unknown',
    );
    const currentResult = starterBattleName
        ? bossActions.getBattleResult(starterBattleName)
        : undefined;

    if (!starter) {
        return <p>Starter not selected yet</p>;
    }

    if (!starterBattleName) {
        return <p>Error: Unable to determine battle name for {starter}</p>;
    }

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
        return <p>Unable to load {LOCATION_NAME} roster</p>;
    }

    const rosterData = rosterQuery.data;

    const levelCap = Math.max(
        ...rosterData.pokemon.map((pokemon) => pokemon.level),
    );
    const acePokemon = [...rosterData.pokemon].sort(
        (a, b) => b.level - a.level,
    )[0];

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            defaultExpanded={false}
            collapsedContent={
                acePokemon
                    ? ({ expand }) => (
                          <BossCollapsedSummary
                              battleName={rosterData.battleName}
                              result={currentResult}
                              acePokemonName={acePokemon.pokemonName}
                              levelCap={levelCap}
                              isNext={isNext}
                              onExpand={expand}
                          />
                      )
                    : undefined
            }
        >
            {({ collapse }) => (
                <>
                    <BossRoster
                        locationName={LOCATION_NAME}
                        roster={rosterData}
                        onCollapse={collapse}
                        showTeam={showTeam}
                    />

                    <BossResultControls
                        currentResult={currentResult}
                        showTeam={showTeam}
                        onToggleTeam={() => setShowTeam((value) => !value)}
                        onResolve={(result) =>
                            bossActions.resolveBattle(starterBattleName, result)
                        }
                        onClear={() =>
                            bossActions.clearBattle(starterBattleName)
                        }
                        isBusy={bossActions.isBusy}
                    />
                </>
            )}
        </ProgressionCard>
    );
}
