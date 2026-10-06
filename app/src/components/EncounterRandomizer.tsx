import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { randomizeEncounter, type RandomizerMode } from '../randomizer';
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

    return (
        <RandomizeButton
            label={hasExistingRoll ? 'Re-roll' : 'Randomize'}
            variant={hasExistingRoll ? 'secondary' : 'warm'}
            onRandomize={randomize}
            disabled={disabled || encounters.length === 0}
            ariaLabel={hasExistingRoll ? 'Re-roll' : 'Randomize'}
            title={hasExistingRoll ? 'Re-roll' : 'Randomize'}
        />
    );
}
