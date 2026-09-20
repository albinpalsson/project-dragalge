import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { randomizeEncounter, type RandomizerMode } from '../randomizer';
import { RandomizeButton } from './RandomizeButton';

interface EncounterRandomizerProps {
    encounters: LocationEncounterView[];
    randomizerMode: RandomizerMode;
    hasExistingRoll: boolean;
    disabled: boolean;
    onPick: (encounter: LocationEncounterView) => void;
}

export function EncounterRandomizer({
    encounters,
    randomizerMode,
    hasExistingRoll,
    disabled,
    onPick,
}: EncounterRandomizerProps) {
    const randomize = () => {
        const encounter = randomizeEncounter(encounters, randomizerMode);
        if (!encounter) {
            return;
        }
        onPick(encounter);
    };

    return (
        <RandomizeButton
            label={hasExistingRoll ? 'Re-roll' : 'Randomize'}
            variant={hasExistingRoll ? 'secondary' : 'warm'}
            onRandomize={randomize}
            disabled={disabled}
            ariaLabel={hasExistingRoll ? 'Re-roll' : 'Randomize'}
            title={hasExistingRoll ? 'Re-roll' : 'Randomize'}
        />
    );
}
