import {
    boolean,
    literal,
    object,
    safeParse,
    string,
    union,
} from '@project-dragalge/validator';
import { POKEMON_TYPES } from '../../utils/pokemon-types';
import { STARTER_NAMES } from '../../utils/starter-choices';
import type { MonoPlanInputs } from './plan-types';

const STORAGE_KEY = 'paldea-nuzlocke-guide:mono-planner-settings';

/** What the planner remembers between visits. */
export interface PlannerSettings extends MonoPlanInputs {
    showAll: boolean;
}

const settingsSchema = object({
    monoType: string(),
    variant: union([literal('s'), literal('v')]),
    futureEvolutions: boolean(),
    dupesClause: boolean(),
    includeTeamStar: boolean(),
    nemonaStarter: string(),
    showAll: boolean(),
});

/** The saved settings, or undefined when there are none or they are unusable. */
export function loadPlannerSettings(): PlannerSettings | undefined {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        const result =
            raw === null
                ? undefined
                : safeParse(settingsSchema, JSON.parse(raw));
        if (!result?.success) {
            return undefined;
        }
        const settings = result.data;
        const monoType = POKEMON_TYPES.find(
            (type) => type === settings.monoType,
        );
        const nemonaStarter =
            settings.nemonaStarter === 'auto'
                ? 'auto'
                : STARTER_NAMES.find((name) => name === settings.nemonaStarter);
        return monoType && nemonaStarter
            ? { ...settings, monoType, nemonaStarter }
            : undefined;
    } catch {
        return undefined;
    }
}

export function savePlannerSettings(settings: PlannerSettings): void {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Could not save the mono planner settings.', error);
    }
}
