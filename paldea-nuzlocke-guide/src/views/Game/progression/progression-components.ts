import { type ComponentType, memo } from 'react';
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
import type { ProgressionItemProps } from './progression-items';

// Kept apart from the progression data so that code which only needs the order
// and rules (Home cards, the tracker) does not pull in every card component.
const PROGRESSION_COMPONENTS: Record<
    string,
    ComponentType<ProgressionItemProps>
> = {
    starter: StarterCard,
    'poco-path': PocoPath,
    'release-starter': ReleaseStarter,
    'inlet-grotto': InletGrotto,
    'south-province-area-one': SouthProvinceAreaOne,
    'nemona-south-province': NemonaSouthProvince,
    'pokemon-league-paldea': PokemonLeaguePaldea,
    'south-province-area-two': SouthProvinceAreaTwo,
    'strong-trainer-angel': AngelStrongTrainer,
    'tera-raid-1-star': TeraRaid1Star,
    'katy-bug-gym': KatyBugGym,
    'south-province-area-three': SouthProvinceAreaThree,
    'strong-trainer-severino': SeverinoStrongTrainer,
    'klawf-stony-cliff-titan': KlawfStonyCliffTitan,
    'brassius-grass-gym': BrassiusGrassGym,
    'south-province-area-four': SouthProvinceAreaFour,
    'tera-raid-2-star': TeraRaid2Star,
    'west-province-area-one': WestProvinceAreaOne,
    'strong-trainer-candina': CandinaStrongTrainer,
    'bombirdier-open-sky-titan': BombirdierOpenSkyTitan,
    'giacomo-dark-star': GiacomoDarkStar,
    'south-paldean-sea': SouthPaldeanSea,
    'east-province-area-one': EastProvinceAreaOne,
    'nemona-third-battle': NemonaThirdBattle,
    'south-province-area-five': SouthProvinceAreaFive,
    'south-province-area-five-trainer-tip': SouthProvinceAreaFiveTrainerTip,
    'strong-trainer-nerea': NereaStrongTrainer,
    'strong-trainer-sofia': SofiaStrongTrainer,
    'east-province-area-two': EastProvinceAreaTwo,
    'strong-trainer-xavier': XavierStrongTrainer,
    'iono-electric-gym': IonoElectricGym,
    'asado-desert': AsadoDesert,
    'asado-desert-trainer-tip': AsadoDesertTrainerTip,
    'strong-trainer-elias': EliasStrongTrainer,
    'east-paldean-sea': EastPaldeanSea,
    'east-province-area-three': EastProvinceAreaThree,
    'mela-fire-star': MelaFireStar,
    'west-province-area-two': WestProvinceAreaTwo,
    'orthworm-lurking-steel-titan': OrthwormLurkingSteelTitan,
    'kofu-water-gym': KofuWaterGym,
    'fourth-badge-shopping-tip': FourthBadgeShoppingTip,
    'west-province-area-three': WestProvinceAreaThree,
    'tagtree-thicket': TagtreeThicket,
    'atticus-poison-star': AtticusPoisonStar,
    'tera-raid-3-star': TeraRaid3Star,
    'west-paldean-sea': WestPaldeanSea,
    'dalizapa-passage': DalizapaPassage,
    'larry-normal-gym': LarryNormalGym,
    'nemona-fourth-battle': NemonaFourthBattle,
    'glaseado-mountain': GlaseadoMountain,
    'strong-trainer-ignacio': IgnacioStrongTrainer,
    'ryme-ghost-gym': RymeGhostGym,
    'mints-tip': MintsTip,
    'alfornada-cavern': AlfornadaCavern,
    'south-province-area-six': SouthProvinceAreaSix,
    'nemona-fifth-battle': NemonaFifthBattle,
    'tera-raid-4-star': TeraRaid4Star,
    'great-tusk-quaking-earth-titan': GreatTuskQuakingEarthTitan,
    'tulip-psychic-gym': TulipPsychicGym,
    'north-province-area-three': NorthProvinceAreaThree,
    'north-paldean-sea': NorthPaldeanSea,
    'grusha-ice-gym': GrushaIceGym,
    'ortega-fairy-star': OrtegaFairyStar,
    'north-province-area-one': NorthProvinceAreaOne,
    'north-province-area-two': NorthProvinceAreaTwo,
    'casseroya-lake': CasseroyaLake,
    'socarrat-trail': SocarratTrail,
    'chansey-leveling-tip': ChanseyLevelingTip,
    'eri-fighting-star': EriFightingStar,
    'dondozo-false-dragon-titan': DondozoFalseDragonTitan,
    'rika-elite-four': RikaEliteFour,
    'poppy-elite-four': PoppyEliteFour,
    'larry-elite-four': LarryEliteFour,
    'hassel-elite-four': HasselEliteFour,
    'geeta-top-champion': GeetaTopChampion,
    'nemona-final-battle': NemonaFinalBattle,
};

// A write should only re-render the cards it affects, not the whole timeline.
const MEMOIZED_PROGRESSION_COMPONENTS = new Map(
    Object.entries(PROGRESSION_COMPONENTS).map(([key, component]) => [
        key,
        memo(component),
    ]),
);

export function getProgressionComponent(
    key: string,
): ComponentType<ProgressionItemProps> {
    const component = MEMOIZED_PROGRESSION_COMPONENTS.get(key);
    if (!component) {
        throw new Error(`No component for progression item "${key}"`);
    }
    return component;
}
