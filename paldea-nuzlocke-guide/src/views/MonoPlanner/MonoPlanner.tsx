import { css } from '@project-dragalge/css-in-js';
import { useEffect, useMemo, useState } from 'react';
import { Checkbox } from '../../components/Checkbox';
import { Select } from '../../components/Select';
import { useEvolutionGraphQuery } from '../../hooks/useEvolutionGraphQuery';
import { usePokemonTypeCatalogQuery } from '../../hooks/usePokemonTypeCatalogQuery';
import { POKEMON_TYPES } from '../../utils/pokemon-types';
import { STARTER_NAMES } from '../../utils/starter-choices';
import { BOSS_BATTLE_NAMES } from './boss-config';
import {
    calculateMonoPlan,
    PLANNER_LOCATION_NAMES,
} from './calculate-mono-plan';
import { rateRun } from './difficulty-rating';
import { MonoPlanOverview } from './MonoPlanOverview';
import { MonoPlanSteps } from './MonoPlanSteps';
import { PlannerDisclaimer } from './PlannerDisclaimer';
import {
    withoutOtherRegionEvolutions,
    withoutOtherRegionForms,
} from './other-regions';
import type { MonoPlan, MonoPlanData } from './plan-types';
import {
    loadPlannerSettings,
    type PlannerSettings,
    savePlannerSettings,
} from './planner-settings-storage';
import {
    useAllLocationEncountersQuery,
    useBaseStatTotalsQuery,
    useBossBattleRostersQuery,
    useTypeChartQuery,
} from './queries';

const DEFAULT_SETTINGS: PlannerSettings = {
    monoType: 'grass',
    futureEvolutions: true,
    variant: 's',
    dupesClause: true,
    includeTeamStar: true,
    nemonaStarter: 'auto',
    showAll: false,
};

const TYPE_OPTIONS = POKEMON_TYPES.map((type) => ({
    value: type,
    label: `${type.charAt(0).toUpperCase()}${type.slice(1)}`,
}));

const VERSION_OPTIONS = [
    { value: 's', label: 'Scarlet' },
    { value: 'v', label: 'Violet' },
];

const STARTER_OPTIONS = [
    { value: 'auto', label: 'Automatic (mono-eligible starter)' },
    ...STARTER_NAMES.map((name) => ({ value: name, label: name })),
];

export function MonoPlanner() {
    const [settings, setSettings] = useState<PlannerSettings>(() => ({
        ...DEFAULT_SETTINGS,
        ...loadPlannerSettings(),
    }));
    const data = usePlannerData();

    useEffect(() => savePlannerSettings(settings), [settings]);

    const {
        monoType,
        variant,
        futureEvolutions,
        dupesClause,
        includeTeamStar,
        nemonaStarter,
        showAll,
    } = settings;
    // Every type is planned with the same settings, so the chosen type can be
    // rated against all the others.
    const plansByType = useMemo(() => {
        const planData = data.value;
        if (!planData) {
            return undefined;
        }
        return new Map<string, MonoPlan>(
            POKEMON_TYPES.map((type): [string, MonoPlan] => [
                type,
                calculateMonoPlan(
                    {
                        monoType: type,
                        variant,
                        futureEvolutions,
                        dupesClause,
                        includeTeamStar,
                        nemonaStarter,
                    },
                    planData,
                ),
            ]),
        );
    }, [
        data.value,
        variant,
        futureEvolutions,
        dupesClause,
        includeTeamStar,
        nemonaStarter,
    ]);
    const plan = plansByType?.get(monoType);
    const rating = useMemo(
        () =>
            plansByType &&
            rateRun(
                new Map(
                    [...plansByType].map(([type, typePlan]) => [
                        type,
                        typePlan.summary,
                    ]),
                ),
                monoType,
            ),
        [plansByType, monoType],
    );

    const update = (changes: Partial<PlannerSettings>) =>
        setSettings((current) => ({ ...current, ...changes }));

    return (
        <section className={page}>
            <div className={header}>
                <h2>Mono type planner</h2>
                <PlannerDisclaimer />
            </div>
            <p className={muted}>
                A heads-up for planning a mono-type run: how hard each boss
                could be, and which Pokémon you might use along the way. It
                doesn&apos;t solve the run; finding the answers is your task
                and is part of the fun. Ratings use type defenses, STAB/Tera
                bonuses and base stats, with plain level-up evolutions up to
                each boss&apos;s level cap. Abilities and Tera Raids are not
                counted.
            </p>

            <div className={controls}>
                <Select
                    label="Mono type"
                    value={monoType}
                    onChange={(value) => update({ monoType: value })}
                    options={TYPE_OPTIONS}
                />
                <Select
                    label="Version"
                    value={variant}
                    onChange={(value) =>
                        update({ variant: value === 'v' ? 'v' : 's' })
                    }
                    options={VERSION_OPTIONS}
                />
                <Select
                    label="Starter (for Nemona's 2nd rival battle)"
                    value={nemonaStarter}
                    onChange={(value) =>
                        update({
                            nemonaStarter:
                                STARTER_NAMES.find((name) => name === value) ??
                                'auto',
                        })
                    }
                    options={STARTER_OPTIONS}
                />
            </div>
            <div className={checks}>
                <Checkbox
                    label="Include future evolutions"
                    checked={futureEvolutions}
                    onChange={(value) => update({ futureEvolutions: value })}
                />
                <Checkbox
                    label="Dupes clause"
                    checked={dupesClause}
                    onChange={(value) => update({ dupesClause: value })}
                />
                <Checkbox
                    label="Include Team Star battles"
                    checked={includeTeamStar}
                    onChange={(value) => update({ includeTeamStar: value })}
                />
            </div>

            {data.error && (
                <p>Error loading planner data: {data.error.message}</p>
            )}
            {!plan && !data.error && <p>Loading planner data...</p>}
            {plan && (
                <>
                    <section className={section}>
                        <h3>Overview</h3>
                        <MonoPlanOverview plan={plan} rating={rating} />
                    </section>
                    <section className={section}>
                        <h3>Threat guide</h3>
                        <Checkbox
                            label="Show all items (otherwise only tricky and hard bosses)"
                            checked={showAll}
                            onChange={(value) => update({ showAll: value })}
                        />
                        <MonoPlanSteps plan={plan} showAll={showAll} />
                    </section>
                </>
            )}
        </section>
    );
}

/** Loads everything the calculation needs; `value` is set once all is there. */
function usePlannerData(): { value?: MonoPlanData; error?: Error } {
    const locations = useAllLocationEncountersQuery(PLANNER_LOCATION_NAMES);
    const catalog = usePokemonTypeCatalogQuery();
    const typeChart = useTypeChartQuery();
    const evolutionGraph = useEvolutionGraphQuery();
    const rosters = useBossBattleRostersQuery(BOSS_BATTLE_NAMES);
    const baseStatTotals = useBaseStatTotalsQuery();

    const value = useMemo(
        () =>
            locations.data &&
            catalog.data &&
            typeChart.data &&
            evolutionGraph.data &&
            rosters.data &&
            baseStatTotals.data
                ? {
                      locationEncounters: new Map(
                          locations.data.map((details) => [
                              details.location.name,
                              details.encounters,
                          ]),
                      ),
                      catalog: withoutOtherRegionForms(catalog.data),
                      typeChart: typeChart.data,
                      evolutionGraph: withoutOtherRegionEvolutions(
                          evolutionGraph.data,
                      ),
                      bossRosters: new Map(
                          rosters.data.map((roster) => [
                              roster.battleName,
                              roster,
                          ]),
                      ),
                      baseStatTotals: baseStatTotals.data,
                  }
                : undefined,
        [
            locations.data,
            catalog.data,
            typeChart.data,
            evolutionGraph.data,
            rosters.data,
            baseStatTotals.data,
        ],
    );
    const error =
        locations.error ??
        catalog.error ??
        typeChart.error ??
        evolutionGraph.error ??
        rosters.error ??
        baseStatTotals.error ??
        undefined;
    return { value, error };
}

const page = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;

    h2 {
        margin: 0;
    }
`;

const header = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    margin-bottom: var(--space-1);
`;

const controls = css`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
    gap: var(--space-3);
`;

const checks = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
`;

const muted = css`
    color: var(--color-text-muted);
`;

const section = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-3);

    & > h3 {
        margin: 0;
        font-size: var(--font-size-lg);
    }
`;
