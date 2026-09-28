import type { ComponentType } from 'react';
import type { EncounterRollRow, GameSettings } from '../../../db/game-db/queries';
import { STARTER_LOCATION_NAME } from '../../../db/game-db/queries';
import { StarterCard } from '../StarterCard';
import { InletGrotto } from './encounters/InletGrotto';
import { PocoPath } from './encounters/PocoPath';
import { PokemonLeaguePaldea } from './encounters/PokemonLeaguePaldea';
import { SouthProvinceAreaOne } from './encounters/SouthProvinceAreaOne';
import { SouthProvinceAreaTwo } from './encounters/SouthProvinceAreaTwo';
import { TeraRaid1Star } from './encounters/TeraRaidXStar';
import { KatyBugGym } from './bosses/KatyBugGym';
import { NemonaSouthProvince } from './bosses/NemonaSouthProvince';
import { ReleaseStarter } from './ReleaseStarter';
import { getStarterBattleName } from '../../../db/pokemon-data/starter-battles';
import { parseTeraRaidLocationName } from '../../../utils/tera-raid-location';

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
    countsTowardProgress?: (state: ProgressionItemState) => boolean;
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

interface RaidProgressionItem extends ProgressionBaseItem {
    kind: 'raid';
    stars: number;
}

export type ProgressionItem =
    | EncounterProgressionItem
    | BossProgressionItem
    | ActionProgressionItem
    | RaidProgressionItem;

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
    {
        key: 'pokemon-league-paldea',
        kind: 'encounter',
        locationName: 'Pokemon League (Paldea)',
        Component: PokemonLeaguePaldea,
    },
    {
        key: 'south-province-area-two',
        kind: 'encounter',
        locationName: 'South Province (Area Two)',
        Component: SouthProvinceAreaTwo,
    },
    {
        key: 'tera-raid-1-star',
        kind: 'raid',
        stars: 1,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
        Component: TeraRaid1Star,
    },
    {
        key: 'katy-bug-gym',
        kind: 'boss',
        getBattleName: () => 'Katy (Bug Gym)',
        Component: KatyBugGym,
    },
];

export function isRaidResolved(
    encounters: EncounterRollRow[],
    stars: number,
): boolean {
    return encounters.some((encounter) => {
        const parsed = parseTeraRaidLocationName(encounter.location_name);
        return parsed?.stars === stars && encounter.status !== 'pending';
    });
}
