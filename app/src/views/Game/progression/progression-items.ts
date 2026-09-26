import type { ComponentType } from 'react';
import type { EncounterRollRow, GameSettings } from '../../../db/game-db/queries';
import { STARTER_LOCATION_NAME } from '../../../db/game-db/queries';
import { StarterCard } from '../StarterCard';
import { InletGrotto } from './encounters/InletGrotto';
import { PocoPath } from './encounters/PocoPath';
import { SouthProvinceAreaOne } from './encounters/SouthProvinceAreaOne';
import { NemonaSouthProvince } from './bosses/NemonaSouthProvince';
import { ReleaseStarter } from './ReleaseStarter';
import { getStarterBattleName } from '../../../db/pokemon-data/starter-battles';

interface ProgressionItemProps {
    isNext?: boolean;
}

interface ProgressionItemState {
    settings: GameSettings;
    encounters: EncounterRollRow[];
}

interface ProgressionBaseItem {
    key: string;
    Component: ComponentType<ProgressionItemProps>;
    isVisible?: (state: ProgressionItemState) => boolean;
}

interface EncounterProgressionItem extends ProgressionBaseItem {
    kind: 'encounter';
    locationName: string;
}

interface BossProgressionItem extends ProgressionBaseItem {
    kind: 'boss';
    getBattleName: (starterName: string) => string | undefined;
}

interface ActionProgressionItem extends ProgressionBaseItem {
    kind: 'action';
    isResolved: (state: ProgressionItemState) => boolean;
}

export type ProgressionItem =
    | EncounterProgressionItem
    | BossProgressionItem
    | ActionProgressionItem;

export const PROGRESSION_ITEMS: ProgressionItem[] = [
    {
        key: 'starter',
        kind: 'encounter',
        locationName: 'Starter',
        Component: StarterCard,
    },
    {
        key: 'poco-path',
        kind: 'encounter',
        locationName: 'Poco Path',
        Component: PocoPath,
    },
    {
        key: 'release-starter',
        kind: 'action',
        isVisible: ({ settings }) => settings.releaseStarterEnabled,
        isResolved: ({ encounters }) =>
            encounters.some(
                (encounter) =>
                    encounter.location_name === STARTER_LOCATION_NAME &&
                    encounter.status === 'released',
            ),
        Component: ReleaseStarter,
    },
    {
        key: 'inlet-grotto',
        kind: 'encounter',
        locationName: 'Inlet Grotto',
        Component: InletGrotto,
    },
    {
        key: 'south-province-area-one',
        kind: 'encounter',
        locationName: 'South Province (Area One)',
        Component: SouthProvinceAreaOne,
    },
    {
        key: 'nemona-south-province',
        kind: 'boss',
        getBattleName: getStarterBattleName,
        Component: NemonaSouthProvince,
    },
];
