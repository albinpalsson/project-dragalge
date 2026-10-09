import { NO_PARTY_SLOT } from '../db/game-db/schema';
import { pickEncounterSpecies } from '../pokemon-species';
import { useGame } from '../views/Game/GameContext';
import { nextFreePartySlot } from './party-utils';
import { useEncounterMutations } from './useEncounterMutations';
import { track } from '../analytics/analytics';

function trackProgression(locationName: string, outcome: string): void {
    track({ name: 'progression_milestone', milestone: locationName, outcome });
}

export function useEncounterActions() {
    const game = useGame();
    const mutations = useEncounterMutations();

    const setStatusAndClearPartySlot = async (
        locationName: string,
        status: 'eliminated' | 'released',
    ) => {
        const current = game.encounters.find(
            (row) => row.location_name === locationName,
        );
        if (current && current.party_slot !== NO_PARTY_SLOT) {
            await mutations.setPartySlot(game.id, locationName, NO_PARTY_SLOT);
        }
        await mutations.setStatus(game.id, locationName, status);
        trackProgression(locationName, status);
    };

    return {
        isBusy: mutations.isBusy,
        rollEncounter(pokemonName: string, locationName: string) {
            return mutations.addRoll(
                game.id,
                locationName,
                pickEncounterSpecies(pokemonName),
            );
        },
        async catchEncounter(locationName: string) {
            const current = game.encounters.find(
                (row) => row.location_name === locationName,
            );
            await mutations.setStatus(game.id, locationName, 'caught');
            trackProgression(locationName, 'caught');
            if (!current || current.party_slot !== NO_PARTY_SLOT) {
                return;
            }
            const slot = nextFreePartySlot(game.encounters);
            if (slot !== NO_PARTY_SLOT) {
                await mutations.setPartySlot(game.id, locationName, slot);
            }
        },
        async skipEncounter(locationName: string) {
            await mutations.skip(game.id, locationName);
            trackProgression(locationName, 'skipped');
        },
        async missEncounter(locationName: string) {
            await mutations.setStatus(game.id, locationName, 'missed');
            trackProgression(locationName, 'missed');
        },
        async eliminateEncounter(locationName: string) {
            await setStatusAndClearPartySlot(locationName, 'eliminated');
        },
        async releaseStarter(locationName: string) {
            await setStatusAndClearPartySlot(locationName, 'released');
        },
        async chooseStarter(
            pokemonName: string,
            locationName: string = '__starter__',
        ) {
            const slot = nextFreePartySlot(game.encounters);
            await mutations.addRoll(
                game.id,
                locationName,
                pickEncounterSpecies(pokemonName),
                'caught',
            );
            trackProgression('Starter', 'chosen');
            if (slot !== NO_PARTY_SLOT) {
                await mutations.setPartySlot(game.id, locationName, slot);
            }
        },
        clearEncounter(locationName: string) {
            return mutations.clear(game.id, locationName);
        },
    };
}
