import type { ComponentType } from 'react';
import type {
    EncounterRollRow,
    GameSettings,
} from '../../../db/game-db/queries';
import { STARTER_LOCATION_NAME } from '../../../db/game-db/queries';
import { StarterCard } from '../StarterCard';
import { InletGrotto } from './encounters/InletGrotto';
import { PocoPath } from './encounters/PocoPath';
import { PokemonLeaguePaldea } from './encounters/PokemonLeaguePaldea';
import { SouthProvinceAreaOne } from './encounters/SouthProvinceAreaOne';
import { SouthProvinceAreaTwo } from './encounters/SouthProvinceAreaTwo';
import { TeraRaid1Star } from './encounters/TeraRaidXStar';
import { TeraRaid2Star } from './encounters/TeraRaid2Star';
import { SouthProvinceAreaThree } from './encounters/SouthProvinceAreaThree';
import { WestProvinceAreaOne } from './encounters/WestProvinceAreaOne';
import { SouthProvinceAreaFour } from './encounters/SouthProvinceAreaFour';
import { KatyBugGym } from './bosses/KatyBugGym';
import { NemonaSouthProvince } from './bosses/NemonaSouthProvince';
import { KlawfStonyCliffTitan } from './bosses/KlawfStonyCliffTitan';
import { BrassiusGrassGym } from './bosses/BrassiusGrassGym';
import { BombirdierOpenSkyTitan } from './bosses/BombirdierOpenSkyTitan';
import { GiacomoDarkStar } from './bosses/GiacomoDarkStar';
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
    checkpointAfter?: boolean;
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
        checkpointAfter: true,
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
        checkpointAfter: true,
        getBattleName: () => 'Katy (Bug Gym)',
        Component: KatyBugGym,
    },
    {
        key: 'south-province-area-three',
        kind: 'encounter',
        locationName: 'South Province (Area Three)',
        Component: SouthProvinceAreaThree,
    },
    {
        key: 'klawf-stony-cliff-titan',
        kind: 'boss',
        getBattleName: () => 'Klawf (Stony Cliff Titan)',
        Component: KlawfStonyCliffTitan,
    },
    {
        key: 'brassius-grass-gym',
        kind: 'boss',
        getBattleName: () => 'Brassius (Grass Gym)',
        Component: BrassiusGrassGym,
    },
    {
        key: 'south-province-area-four',
        kind: 'encounter',
        locationName: 'South Province (Area Four)',
        Component: SouthProvinceAreaFour,
    },
    {
        key: 'tera-raid-2-star',
        kind: 'raid',
        stars: 2,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
        Component: TeraRaid2Star,
    },
    {
        key: 'west-province-area-one',
        kind: 'encounter',
        locationName: 'West Province (Area One)',
        Component: WestProvinceAreaOne,
    },
    {
        key: 'bombirdier-open-sky-titan',
        kind: 'boss',
        getBattleName: () => 'Bombirdier (Open Sky Titan)',
        Component: BombirdierOpenSkyTitan,
    },
    {
        key: 'giacomo-dark-star',
        kind: 'boss',
        getBattleName: () => 'Giacomo (Dark Star)',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        Component: GiacomoDarkStar,
    },
];

export function getVisibleProgressionItems(
    state: ProgressionItemState,
): ProgressionItem[] {
    return PROGRESSION_ITEMS.filter((item) => item.isVisible?.(state) ?? true);
}
export function isRaidResolved(
    encounters: EncounterRollRow[],
    stars: number,
): boolean {
    return encounters.some((encounter) => {
        const parsed = parseTeraRaidLocationName(encounter.location_name);
        return parsed?.stars === stars && encounter.status !== 'pending';
    });
}
