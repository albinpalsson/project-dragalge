import { NO_PARTY_SLOT } from '../db/game-db/schema';
import { useGame } from '../views/Game/GameContext';
import { nextFreePartySlot } from './party-utils';
import { useEncounterMutations } from './useEncounterMutations';

export function useEncounterActions() {
    const game = useGame();
    const mutations = useEncounterMutations();

    return {
        isBusy: mutations.isBusy,
        rollEncounter(pokemonName: string, locationName: string) {
            return mutations.addRoll(game.id, locationName, pokemonName);
        },
        async catchEncounter(locationName: string) {
            await mutations.setStatus(game.id, locationName, 'caught');
            const current = game.encounters.find(
                (row) => row.location_name === locationName,
            );
            if (!current || current.party_slot !== NO_PARTY_SLOT) {
                return;
            }
            const slot = nextFreePartySlot(game.encounters);
            if (slot !== NO_PARTY_SLOT) {
                await mutations.setPartySlot(game.id, locationName, slot);
            }
        },
        missEncounter(locationName: string) {
            return mutations.setStatus(game.id, locationName, 'missed');
        },
        async eliminateEncounter(locationName: string) {
            const current = game.encounters.find(
                (row) => row.location_name === locationName,
            );
            if (current && current.party_slot !== NO_PARTY_SLOT) {
                await mutations.setPartySlot(
                    game.id,
                    locationName,
                    NO_PARTY_SLOT,
                );
            }
            await mutations.setStatus(game.id, locationName, 'eliminated');
        },
        async chooseStarter(
            pokemonName: string,
            locationName: string = '__starter__',
        ) {
            const slot = nextFreePartySlot(game.encounters);
            await mutations.addRoll(
                game.id,
                locationName,
                pokemonName,
                'caught',
            );
            if (slot !== NO_PARTY_SLOT) {
                await mutations.setPartySlot(game.id, locationName, slot);
            }
        },
        clearRoll(locationName: string) {
            return mutations.clearRoll(game.id, locationName);
        },
    };
}
