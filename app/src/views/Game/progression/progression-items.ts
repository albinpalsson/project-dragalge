import type { ComponentType } from 'react';
import { StarterCard } from '../StarterCard';
import { InletGrotto } from './encounters/InletGrotto';
import { PocoPath } from './encounters/PocoPath';
import { SouthProvinceAreaOne } from './encounters/SouthProvinceAreaOne';
import { NemonaSouthProvince } from './bosses/NemonaSouthProvince';
import { getStarterBattleName } from '../../../db/pokemon-data/starter-battles';

interface ProgressionItemProps {
    isNext?: boolean;
}

interface EncounterProgressionItem {
    key: string;
    kind: 'encounter';
    locationName: string;
    Component: ComponentType<ProgressionItemProps>;
}

interface BossProgressionItem {
    key: string;
    kind: 'boss';
    getBattleName: (starterName: string) => string | undefined;
    Component: ComponentType<ProgressionItemProps>;
}

export type ProgressionItem = EncounterProgressionItem | BossProgressionItem;

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
