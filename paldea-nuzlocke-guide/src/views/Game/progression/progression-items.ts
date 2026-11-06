import type {
    EncounterRollRow,
    GameSettings,
} from '../../../db/game-db/queries';
import {
    FINAL_BATTLE_NAME,
    STARTER_LOCATION_NAME,
} from '../../../db/game-db/queries';
import { getNemonaBattleName } from '../../../db/pokemon-data/starter-battles';
import { parseTeraRaidLocationName } from '../../../utils/tera-raid-location';

export interface ProgressionItemProps {
    isNext?: boolean;
}

export interface ProgressionItemState {
    settings: GameSettings;
    encounters: EncounterRollRow[];
}

interface ProgressionBaseItem {
    key: string;
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

interface InfoProgressionItem extends ProgressionBaseItem {
    kind: 'info';
    countsTowardProgress: () => false;
}

export type ProgressionItem =
    | EncounterProgressionItem
    | BossProgressionItem
    | ActionProgressionItem
    | RaidProgressionItem
    | InfoProgressionItem;

export const PROGRESSION_ITEMS: ProgressionItem[] = [
    {
        key: 'starter',
        kind: 'encounter',
        locationName: 'Starter',
    },
    {
        key: 'poco-path',
        kind: 'encounter',
        locationName: 'Poco Path',
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
    },
    {
        key: 'inlet-grotto',
        kind: 'encounter',
        locationName: 'Inlet Grotto',
    },
    {
        key: 'arven-first-battle',
        kind: 'boss',
        isVisible: ({ settings }) => settings.releaseStarterEnabled,
        countsTowardProgress: () => false,
        getBattleName: () => 'Arven',
    },
    {
        key: 'south-province-area-one',
        kind: 'encounter',
        locationName: 'South Province (Area One)',
    },
    {
        key: 'nemona-south-province',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Second'),
    },
    {
        key: 'pokemon-league-paldea',
        kind: 'encounter',
        locationName: 'Pokemon League',
    },
    {
        key: 'south-province-area-two',
        kind: 'encounter',
        locationName: 'South Province (Area Two)',
    },
    {
        key: 'strong-trainer-angel',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Angel the Courier',
    },
    {
        key: 'tera-raid-1-star',
        kind: 'raid',
        stars: 1,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
    },
    {
        key: 'katy-bug-gym',
        kind: 'boss',
        getBattleName: () => 'Katy (Bug Gym)',
    },
    {
        key: 'south-province-area-three',
        kind: 'encounter',
        locationName: 'South Province (Area Three)',
    },
    {
        key: 'strong-trainer-severino',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Severino the Office Worker',
    },
    {
        key: 'klawf-stony-cliff-titan',
        kind: 'boss',
        getBattleName: () => 'Klawf (Stony Cliff Titan)',
    },
    {
        key: 'brassius-grass-gym',
        kind: 'boss',
        getBattleName: () => 'Brassius (Grass Gym)',
    },
    {
        key: 'south-province-area-four',
        kind: 'encounter',
        locationName: 'South Province (Area Four)',
    },
    {
        key: 'tera-raid-2-star',
        kind: 'raid',
        stars: 2,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
    },
    {
        key: 'west-province-area-one',
        kind: 'encounter',
        locationName: 'West Province (Area One)',
    },
    {
        key: 'strong-trainer-candina',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Candina the Model',
    },
    {
        key: 'bombirdier-open-sky-titan',
        kind: 'boss',
        getBattleName: () => 'Bombirdier (Open Sky Titan)',
    },
    {
        key: 'giacomo-dark-star',
        kind: 'boss',
        getBattleName: () => 'Giacomo (Dark Star)',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
    },
    {
        key: 'south-paldean-sea',
        kind: 'encounter',
        locationName: 'South Paldean Sea',
    },
    {
        key: 'east-province-area-one',
        kind: 'encounter',
        locationName: 'East Province (Area One)',
    },
    {
        key: 'strong-trainer-xavier',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Xavier the Student',
    },
    {
        key: 'nemona-third-battle',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Third'),
    },
    {
        key: 'south-province-area-five',
        kind: 'encounter',
        locationName: 'South Province (Area Five)',
    },
    {
        key: 'south-province-area-five-trainer-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
    },
    {
        key: 'strong-trainer-nerea',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Hiker Nerea',
    },
    {
        key: 'strong-trainer-sofia',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Sofia the Waitress',
    },
    {
        key: 'east-province-area-two',
        kind: 'encounter',
        locationName: 'East Province (Area Two)',
    },
    {
        key: 'iono-electric-gym',
        kind: 'boss',
        getBattleName: () => 'Iono (Electric Gym)',
    },
    {
        key: 'asado-desert',
        kind: 'encounter',
        locationName: 'Asado Desert',
    },
    {
        key: 'asado-desert-trainer-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
    },
    {
        key: 'strong-trainer-elias',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Elias the Black Belt',
    },
    {
        key: 'east-paldean-sea',
        kind: 'encounter',
        locationName: 'East Paldean Sea',
    },
    {
        key: 'east-province-area-three',
        kind: 'encounter',
        locationName: 'East Province (Area Three)',
    },
    {
        key: 'mela-fire-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Mela (Fire Star)',
    },
    {
        key: 'west-province-area-two',
        kind: 'encounter',
        locationName: 'West Province (Area Two)',
    },
    {
        key: 'orthworm-lurking-steel-titan',
        kind: 'boss',
        getBattleName: () => 'Orthworm (Lurking Steel Titan)',
    },
    {
        key: 'kofu-water-gym',
        kind: 'boss',
        getBattleName: () => 'Kofu (Water Gym)',
    },
    {
        key: 'fourth-badge-shopping-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
    },
    {
        key: 'west-province-area-three',
        kind: 'encounter',
        locationName: 'West Province (Area Three)',
    },
    {
        key: 'tagtree-thicket',
        kind: 'encounter',
        locationName: 'Tagtree Thicket',
    },
    {
        key: 'atticus-poison-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Atticus (Poison Star)',
    },
    {
        key: 'tera-raid-3-star',
        kind: 'raid',
        stars: 3,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
    },
    {
        key: 'west-paldean-sea',
        kind: 'encounter',
        locationName: 'West Paldean Sea',
    },
    {
        key: 'dalizapa-passage',
        kind: 'encounter',
        locationName: 'Dalizapa Passage',
    },
    {
        key: 'larry-normal-gym',
        kind: 'boss',
        getBattleName: () => 'Larry (Normal Gym)',
    },
    {
        key: 'nemona-fourth-battle',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Fourth'),
    },
    {
        key: 'glaseado-mountain',
        kind: 'encounter',
        locationName: 'Glaseado Mountain',
    },
    {
        key: 'strong-trainer-ignacio',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Ignacio the Scientist',
    },
    {
        key: 'ryme-ghost-gym',
        kind: 'boss',
        getBattleName: () => 'Ryme (Ghost Gym)',
    },
    {
        key: 'mints-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
    },
    {
        key: 'alfornada-cavern',
        kind: 'encounter',
        locationName: 'Alfornada Cavern',
    },
    {
        key: 'south-province-area-six',
        kind: 'encounter',
        locationName: 'South Province (Area Six)',
    },
    {
        key: 'nemona-fifth-battle',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Fifth'),
    },
    {
        key: 'tera-raid-4-star',
        kind: 'raid',
        stars: 4,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
    },
    {
        key: 'great-tusk-quaking-earth-titan',
        kind: 'boss',
        getBattleName: () => 'Great Tusk/Iron Treads (Quaking Earth Titan)',
    },
    {
        key: 'tulip-psychic-gym',
        kind: 'boss',
        getBattleName: () => 'Tulip (Psychic Gym)',
    },
    {
        key: 'north-province-area-three',
        kind: 'encounter',
        locationName: 'North Province (Area Three)',
    },
    {
        key: 'north-paldean-sea',
        kind: 'encounter',
        locationName: 'North Paldean Sea',
    },
    {
        key: 'grusha-ice-gym',
        kind: 'boss',
        getBattleName: () => 'Grusha (Ice Gym)',
    },
    {
        key: 'ortega-fairy-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Ortega (Fairy Star)',
    },
    {
        key: 'north-province-area-one',
        kind: 'encounter',
        locationName: 'North Province (Area One)',
    },
    {
        key: 'north-province-area-two',
        kind: 'encounter',
        locationName: 'North Province (Area Two)',
    },
    {
        key: 'casseroya-lake',
        kind: 'encounter',
        locationName: 'Casseroya Lake',
    },
    {
        key: 'socarrat-trail',
        kind: 'encounter',
        locationName: 'Socarrat Trail',
    },
    {
        key: 'chansey-leveling-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
    },
    {
        key: 'eri-fighting-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Eri (Fighting Star)',
    },
    {
        key: 'dondozo-false-dragon-titan',
        kind: 'boss',
        getBattleName: () => 'Dondozo (False Dragon Titan)',
    },
    {
        key: 'rika-elite-four',
        kind: 'boss',
        getBattleName: () => 'Rika (Elite Four)',
    },
    {
        key: 'poppy-elite-four',
        kind: 'boss',
        getBattleName: () => 'Poppy (Elite Four)',
    },
    {
        key: 'larry-elite-four',
        kind: 'boss',
        getBattleName: () => 'Larry (Elite Four)',
    },
    {
        key: 'hassel-elite-four',
        kind: 'boss',
        getBattleName: () => 'Hassel (Elite Four)',
    },
    {
        key: 'geeta-top-champion',
        kind: 'boss',
        getBattleName: () => FINAL_BATTLE_NAME,
    },
    {
        key: 'nemona-final-battle',
        kind: 'boss',
        countsTowardProgress: () => false,
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Final'),
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
