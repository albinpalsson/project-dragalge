import type { LocationEncounterView } from '../db/pokemon-data/queries';
import {
    getEncounterOdds,
    randomizeEncounter,
    type RandomizerMode,
} from '../randomizer';
import { RandomizeButton } from './RandomizeButton';

interface EncounterRandomizerProps {
    encounters: LocationEncounterView[];
    randomizerMode: RandomizerMode;
    hasExistingRoll: boolean;
    disabled: boolean;
    onPick: (pokemonName: string) => void;
}

export function EncounterRandomizer({
    encounters,
    randomizerMode,
    hasExistingRoll,
    disabled,
    onPick,
}: EncounterRandomizerProps) {
    const randomize = () => {
        const pokemonName = randomizeEncounter(encounters, randomizerMode);
        if (!pokemonName) {
            return;
        }
        onPick(pokemonName);
    };

    const isSingleOption =
        getEncounterOdds(encounters, randomizerMode).length === 1;
    if (isSingleOption && hasExistingRoll) {
        return null;
    }

    const label = isSingleOption
        ? 'Encounter'
        : hasExistingRoll
          ? 'Re-roll'
          : 'Randomize';

    return (
        <RandomizeButton
            label={label}
            variant={hasExistingRoll ? 'secondary' : 'warm'}
            onRandomize={randomize}
            disabled={disabled || encounters.length === 0}
            ariaLabel={label}
            title={label}
            instant={isSingleOption}
        />
    );
}
