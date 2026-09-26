import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { randomizeEncounter, type RandomizerMode } from '../randomizer';
import { RandomizeButton } from './RandomizeButton';
import { useBanReasons } from '../hooks/useBanReasons';
import { getBanReason } from '../utils/ban-list';

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
    const banReasons = useBanReasons();
    const availableEncounters = encounters.filter(
        (encounter) => !getBanReason(banReasons, encounter.name),
    );
    const randomize = () => {
        const encounter = randomizeEncounter(
            availableEncounters,
            randomizerMode,
        );
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
            disabled={disabled || availableEncounters.length === 0}
            ariaLabel={hasExistingRoll ? 'Re-roll' : 'Randomize'}
            title={hasExistingRoll ? 'Re-roll' : 'Randomize'}
        />
    );
}
