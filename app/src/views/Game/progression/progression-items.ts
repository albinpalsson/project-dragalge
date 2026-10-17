import type { ComponentType } from 'react';
import type {
    EncounterRollRow,
    GameSettings,
} from '../../../db/game-db/queries';
import { STARTER_LOCATION_NAME } from '../../../db/game-db/queries';
import { getNemonaBattleName } from '../../../db/pokemon-data/starter-battles';
import { parseTeraRaidLocationName } from '../../../utils/tera-raid-location';
import { StarterCard } from '../StarterCard';
import { AtticusPoisonStar } from './bosses/AtticusPoisonStar';
import { BombirdierOpenSkyTitan } from './bosses/BombirdierOpenSkyTitan';
import { BrassiusGrassGym } from './bosses/BrassiusGrassGym';
import { DondozoFalseDragonTitan } from './bosses/DondozoFalseDragonTitan';
import { EriFightingStar } from './bosses/EriFightingStar';
import { GeetaTopChampion } from './bosses/GeetaTopChampion';
import { GiacomoDarkStar } from './bosses/GiacomoDarkStar';
import { GreatTuskQuakingEarthTitan } from './bosses/GreatTuskQuakingEarthTitan';
import { GrushaIceGym } from './bosses/GrushaIceGym';
import { HasselEliteFour } from './bosses/HasselEliteFour';
import { IonoElectricGym } from './bosses/IonoElectricGym';
import { KatyBugGym } from './bosses/KatyBugGym';
import { KlawfStonyCliffTitan } from './bosses/KlawfStonyCliffTitan';
import { KofuWaterGym } from './bosses/KofuWaterGym';
import { LarryEliteFour } from './bosses/LarryEliteFour';
import { LarryNormalGym } from './bosses/LarryNormalGym';
import { MelaFireStar } from './bosses/MelaFireStar';
import { NemonaFifthBattle } from './bosses/NemonaFifthBattle';
import { NemonaFinalBattle } from './bosses/NemonaFinalBattle';
import { NemonaFourthBattle } from './bosses/NemonaFourthBattle';
import { NemonaSouthProvince } from './bosses/NemonaSouthProvince';
import { NemonaThirdBattle } from './bosses/NemonaThirdBattle';
import { OrtegaFairyStar } from './bosses/OrtegaFairyStar';
import { OrthwormLurkingSteelTitan } from './bosses/OrthwormLurkingSteelTitan';
import { PoppyEliteFour } from './bosses/PoppyEliteFour';
import { RikaEliteFour } from './bosses/RikaEliteFour';
import { RymeGhostGym } from './bosses/RymeGhostGym';
import { TulipPsychicGym } from './bosses/TulipPsychicGym';
import { AlfornadaCavern } from './encounters/AlfornadaCavern';
import { AsadoDesert } from './encounters/AsadoDesert';
import { CasseroyaLake } from './encounters/CasseroyaLake';
import { DalizapaPassage } from './encounters/DalizapaPassage';
import { EastPaldeanSea } from './encounters/EastPaldeanSea';
import { EastProvinceAreaOne } from './encounters/EastProvinceAreaOne';
import { EastProvinceAreaThree } from './encounters/EastProvinceAreaThree';
import { EastProvinceAreaTwo } from './encounters/EastProvinceAreaTwo';
import { GlaseadoMountain } from './encounters/GlaseadoMountain';
import { InletGrotto } from './encounters/InletGrotto';
import { NorthPaldeanSea } from './encounters/NorthPaldeanSea';
import { NorthProvinceAreaOne } from './encounters/NorthProvinceAreaOne';
import { NorthProvinceAreaThree } from './encounters/NorthProvinceAreaThree';
import { NorthProvinceAreaTwo } from './encounters/NorthProvinceAreaTwo';
import { PocoPath } from './encounters/PocoPath';
import { PokemonLeaguePaldea } from './encounters/PokemonLeaguePaldea';
import { SocarratTrail } from './encounters/SocarratTrail';
import { SouthPaldeanSea } from './encounters/SouthPaldeanSea';
import { SouthProvinceAreaFive } from './encounters/SouthProvinceAreaFive';
import { SouthProvinceAreaFour } from './encounters/SouthProvinceAreaFour';
import { SouthProvinceAreaOne } from './encounters/SouthProvinceAreaOne';
import { SouthProvinceAreaSix } from './encounters/SouthProvinceAreaSix';
import { SouthProvinceAreaThree } from './encounters/SouthProvinceAreaThree';
import { SouthProvinceAreaTwo } from './encounters/SouthProvinceAreaTwo';
import { TagtreeThicket } from './encounters/TagtreeThicket';
import { TeraRaid2Star } from './encounters/TeraRaid2Star';
import { TeraRaid3Star } from './encounters/TeraRaid3Star';
import { TeraRaid4Star } from './encounters/TeraRaid4Star';
import { TeraRaid1Star } from './encounters/TeraRaidXStar';
import { WestPaldeanSea } from './encounters/WestPaldeanSea';
import { WestProvinceAreaOne } from './encounters/WestProvinceAreaOne';
import { WestProvinceAreaThree } from './encounters/WestProvinceAreaThree';
import { WestProvinceAreaTwo } from './encounters/WestProvinceAreaTwo';
import { ReleaseStarter } from './ReleaseStarter';
import { ChanseyLevelingTip } from './ChanseyLevelingTip';
import { FourthBadgeShoppingTip, MintsTip } from './ShoppingTips';
import {
    AsadoDesertTrainerTip,
    SouthProvinceAreaFiveTrainerTip,
} from './TrainerRewardTips';
import { AngelStrongTrainer } from './trainers/AngelStrongTrainer';
import { CandinaStrongTrainer } from './trainers/CandinaStrongTrainer';
import { EliasStrongTrainer } from './trainers/EliasStrongTrainer';
import { IgnacioStrongTrainer } from './trainers/IgnacioStrongTrainer';
import { NereaStrongTrainer } from './trainers/NereaStrongTrainer';
import { SeverinoStrongTrainer } from './trainers/SeverinoStrongTrainer';
import { SofiaStrongTrainer } from './trainers/SofiaStrongTrainer';
import { XavierStrongTrainer } from './trainers/XavierStrongTrainer';

interface ProgressionItemProps {
    isNext?: boolean;
}

export interface ProgressionItemState {
    settings: GameSettings;
    encounters: EncounterRollRow[];
}

interface ProgressionBaseItem {
    key: string;
    Component: ComponentType<ProgressionItemProps>;
    checkpointBefore?: boolean;
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
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Second'),
        Component: NemonaSouthProvince,
    },
    {
        key: 'pokemon-league-paldea',
        kind: 'encounter',
        checkpointBefore: true,
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
        key: 'strong-trainer-angel',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Angel the Courier',
        Component: AngelStrongTrainer,
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
    {
        key: 'south-province-area-three',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'South Province (Area Three)',
        Component: SouthProvinceAreaThree,
    },
    {
        key: 'strong-trainer-severino',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Severino the Office Worker',
        Component: SeverinoStrongTrainer,
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
        checkpointBefore: true,
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
        key: 'strong-trainer-candina',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Candina the Model',
        Component: CandinaStrongTrainer,
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
    {
        key: 'south-paldean-sea',
        kind: 'encounter',
        locationName: 'South Paldean Sea',
        checkpointBefore: true,
        Component: SouthPaldeanSea,
    },
    {
        key: 'east-province-area-one',
        kind: 'encounter',
        locationName: 'East Province (Area One)',
        Component: EastProvinceAreaOne,
    },
    {
        key: 'nemona-third-battle',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Third'),
        Component: NemonaThirdBattle,
    },
    {
        key: 'south-province-area-five',
        kind: 'encounter',
        locationName: 'South Province (Area Five)',
        Component: SouthProvinceAreaFive,
    },
    {
        key: 'south-province-area-five-trainer-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
        Component: SouthProvinceAreaFiveTrainerTip,
    },
    {
        key: 'strong-trainer-nerea',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Hiker Nerea',
        Component: NereaStrongTrainer,
    },
    {
        key: 'strong-trainer-sofia',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Sofia the Waitress',
        Component: SofiaStrongTrainer,
    },
    {
        key: 'east-province-area-two',
        kind: 'encounter',
        locationName: 'East Province (Area Two)',
        Component: EastProvinceAreaTwo,
    },
    {
        key: 'strong-trainer-xavier',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Xavier the Student',
        Component: XavierStrongTrainer,
    },
    {
        key: 'iono-electric-gym',
        kind: 'boss',
        getBattleName: () => 'Iono (Electric Gym)',
        Component: IonoElectricGym,
    },
    {
        key: 'asado-desert',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'Asado Desert',
        Component: AsadoDesert,
    },
    {
        key: 'asado-desert-trainer-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
        Component: AsadoDesertTrainerTip,
    },
    {
        key: 'strong-trainer-elias',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Elias the Black Belt',
        Component: EliasStrongTrainer,
    },
    {
        key: 'east-paldean-sea',
        kind: 'encounter',
        locationName: 'East Paldean Sea',
        Component: EastPaldeanSea,
    },
    {
        key: 'east-province-area-three',
        kind: 'encounter',
        locationName: 'East Province (Area Three)',
        Component: EastProvinceAreaThree,
    },
    {
        key: 'mela-fire-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Mela (Fire Star)',
        Component: MelaFireStar,
    },
    {
        key: 'west-province-area-two',
        kind: 'encounter',
        locationName: 'West Province (Area Two)',
        Component: WestProvinceAreaTwo,
    },
    {
        key: 'orthworm-lurking-steel-titan',
        kind: 'boss',
        getBattleName: () => 'Orthworm (Lurking Steel Titan)',
        Component: OrthwormLurkingSteelTitan,
    },
    {
        key: 'kofu-water-gym',
        kind: 'boss',
        getBattleName: () => 'Kofu (Water Gym)',
        Component: KofuWaterGym,
    },
    {
        key: 'fourth-badge-shopping-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
        Component: FourthBadgeShoppingTip,
    },
    {
        key: 'west-province-area-three',
        kind: 'encounter',
        locationName: 'West Province (Area Three)',
        Component: WestProvinceAreaThree,
    },
    {
        key: 'tagtree-thicket',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'Tagtree Thicket',
        Component: TagtreeThicket,
    },
    {
        key: 'atticus-poison-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Atticus (Poison Star)',
        Component: AtticusPoisonStar,
    },
    {
        key: 'tera-raid-3-star',
        kind: 'raid',
        stars: 3,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
        Component: TeraRaid3Star,
    },
    {
        key: 'west-paldean-sea',
        kind: 'encounter',
        locationName: 'West Paldean Sea',
        Component: WestPaldeanSea,
    },
    {
        key: 'dalizapa-passage',
        kind: 'encounter',
        locationName: 'Dalizapa Passage',
        Component: DalizapaPassage,
    },
    {
        key: 'larry-normal-gym',
        kind: 'boss',
        getBattleName: () => 'Larry (Normal Gym)',
        Component: LarryNormalGym,
    },
    {
        key: 'nemona-fourth-battle',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Fourth'),
        Component: NemonaFourthBattle,
    },
    {
        key: 'glaseado-mountain',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'Glaseado Mountain',
        Component: GlaseadoMountain,
    },
    {
        key: 'strong-trainer-ignacio',
        kind: 'boss',
        isVisible: ({ settings }) => settings.showStrongTrainers,
        countsTowardProgress: () => false,
        getBattleName: () => 'Ignacio the Scientist',
        Component: IgnacioStrongTrainer,
    },
    {
        key: 'ryme-ghost-gym',
        kind: 'boss',
        getBattleName: () => 'Ryme (Ghost Gym)',
        Component: RymeGhostGym,
    },
    {
        key: 'mints-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
        Component: MintsTip,
    },
    {
        key: 'alfornada-cavern',
        kind: 'encounter',
        locationName: 'Alfornada Cavern',
        Component: AlfornadaCavern,
    },
    {
        key: 'south-province-area-six',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'South Province (Area Six)',
        Component: SouthProvinceAreaSix,
    },
    {
        key: 'nemona-fifth-battle',
        kind: 'boss',
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Fifth'),
        Component: NemonaFifthBattle,
    },
    {
        key: 'tera-raid-4-star',
        kind: 'raid',
        stars: 4,
        isVisible: ({ settings }) => settings.teraRaids !== 'none',
        countsTowardProgress: ({ settings }) => settings.teraRaids === 'single',
        Component: TeraRaid4Star,
    },
    {
        key: 'great-tusk-quaking-earth-titan',
        kind: 'boss',
        getBattleName: () => 'Great Tusk/Iron Treads (Quaking Earth Titan)',
        Component: GreatTuskQuakingEarthTitan,
    },
    {
        key: 'tulip-psychic-gym',
        kind: 'boss',
        getBattleName: () => 'Tulip (Psychic Gym)',
        Component: TulipPsychicGym,
    },
    {
        key: 'north-province-area-three',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'North Province (Area Three)',
        Component: NorthProvinceAreaThree,
    },
    {
        key: 'north-paldean-sea',
        kind: 'encounter',
        locationName: 'North Paldean Sea',
        Component: NorthPaldeanSea,
    },
    {
        key: 'grusha-ice-gym',
        kind: 'boss',
        getBattleName: () => 'Grusha (Ice Gym)',
        Component: GrushaIceGym,
    },
    {
        key: 'ortega-fairy-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Ortega (Fairy Star)',
        Component: OrtegaFairyStar,
    },
    {
        key: 'north-province-area-one',
        kind: 'encounter',
        checkpointBefore: true,
        locationName: 'North Province (Area One)',
        Component: NorthProvinceAreaOne,
    },
    {
        key: 'north-province-area-two',
        kind: 'encounter',
        locationName: 'North Province (Area Two)',
        Component: NorthProvinceAreaTwo,
    },
    {
        key: 'casseroya-lake',
        kind: 'encounter',
        locationName: 'Casseroya Lake',
        Component: CasseroyaLake,
    },
    {
        key: 'socarrat-trail',
        kind: 'encounter',
        locationName: 'Socarrat Trail',
        Component: SocarratTrail,
    },
    {
        key: 'chansey-leveling-tip',
        kind: 'info',
        isVisible: ({ settings }) => settings.showHelpfulTips,
        countsTowardProgress: () => false,
        Component: ChanseyLevelingTip,
    },
    {
        key: 'eri-fighting-star',
        kind: 'boss',
        isVisible: ({ settings }) => settings.includeTeamStarBattles,
        getBattleName: () => 'Eri (Fighting Star)',
        Component: EriFightingStar,
    },
    {
        key: 'dondozo-false-dragon-titan',
        kind: 'boss',
        getBattleName: () => 'Dondozo (False Dragon Titan)',
        Component: DondozoFalseDragonTitan,
    },
    {
        key: 'rika-elite-four',
        kind: 'boss',
        getBattleName: () => 'Rika (Elite Four)',
        Component: RikaEliteFour,
    },
    {
        key: 'poppy-elite-four',
        kind: 'boss',
        getBattleName: () => 'Poppy (Elite Four)',
        Component: PoppyEliteFour,
    },
    {
        key: 'larry-elite-four',
        kind: 'boss',
        getBattleName: () => 'Larry (Elite Four)',
        Component: LarryEliteFour,
    },
    {
        key: 'hassel-elite-four',
        kind: 'boss',
        getBattleName: () => 'Hassel (Elite Four)',
        Component: HasselEliteFour,
    },
    {
        key: 'geeta-top-champion',
        kind: 'boss',
        getBattleName: () => 'Geeta (Top Champion)',
        Component: GeetaTopChampion,
    },
    {
        key: 'nemona-final-battle',
        kind: 'boss',
        countsTowardProgress: () => false,
        getBattleName: (starterName) =>
            getNemonaBattleName(starterName, 'Final'),
        Component: NemonaFinalBattle,
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
