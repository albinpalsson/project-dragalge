import { BossRoster } from './BossRoster';
import { BossResultControls } from './BossResultControls';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { useBossActions } from '../../../../hooks/useBossActions';
import { useStarter } from '../../../../hooks/useStarter';
import { getStarterBattleName } from '../../../../db/pokemon-data/starter-battles';
import { useBossBattleRosterQuery } from '../../queries';

const LOCATION_NAME = 'South Province (Area One)';

export function NemonaSouthProvince() {
    const bossActions = useBossActions();
    const starter = useStarter();
    const starterBattleName = starter
        ? getStarterBattleName(starter)
        : undefined;

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

    return (
        <ProgressionCard compact dimmed={currentResult === 'won'}>
            <BossRoster title={LOCATION_NAME} roster={rosterQuery.data} />

            <BossResultControls
                currentResult={currentResult}
                onResolve={(result) =>
                    bossActions.resolveBattle(starterBattleName, result)
                }
                onClear={() => bossActions.clearBattle(starterBattleName)}
                isBusy={bossActions.isBusy}
            />
        </ProgressionCard>
    );
}
