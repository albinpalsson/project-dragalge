import { nextFreePartySlot } from '../db/game-db/party-slots';
import { NO_PARTY_SLOT } from '../db/game-db/schema';
import type { BoxSectionKind } from '../views/Game/Box/box-model';
import { useGame } from '../views/Game/GameContext';
import { useEncounterMutations } from './useEncounterMutations';

export function usePartyManager() {
    const game = useGame();
    const mutations = useEncounterMutations();

    const moveToParty = async (locationName: string): Promise<boolean> => {
        const row = game.encounters.find(
            (encounter) => encounter.location_name === locationName,
        );
        if (!row) {
            return false;
        }

        if (row.party_slot !== NO_PARTY_SLOT) {
            return true;
        }

        const slot = await mutations.setStatus(
            game.name,
            locationName,
            'caught',
            { assignPartySlot: true },
        );
        return slot !== NO_PARTY_SLOT;
    };

    const moveToBox = async (locationName: string): Promise<boolean> => {
        const row = game.encounters.find(
            (encounter) => encounter.location_name === locationName,
        );
        if (!row) {
            return false;
        }

        if (row.party_slot !== NO_PARTY_SLOT) {
            await mutations.setPartySlot(game.name, locationName, NO_PARTY_SLOT);
        }
        if (row.status === 'eliminated') {
            await mutations.setStatus(game.name, locationName, 'caught');
        }
        return true;
    };

    const moveToDeathBox = async (locationName: string): Promise<boolean> => {
        const row = game.encounters.find(
            (encounter) => encounter.location_name === locationName,
        );
        if (!row) {
            return false;
        }
        await mutations.setStatus(game.name, locationName, 'eliminated');
        return true;
    };

    return {
        isBusy: mutations.isBusy,
        freeSlot: nextFreePartySlot(game.encounters),
        addToParty: moveToParty,
        removeFromParty(locationName: string) {
            return mutations.setPartySlot(game.name, locationName, NO_PARTY_SLOT);
        },
        async replacePartyMember(outgoing: string, incoming: string) {
            const row = game.encounters.find(
                (entry) => entry.location_name === outgoing,
            );
            if (!row) {
                return;
            }
            await mutations.setPartySlot(game.name, outgoing, NO_PARTY_SLOT);
            await mutations.setPartySlot(game.name, incoming, row.party_slot);
        },
        eliminate(locationName: string) {
            return mutations.setStatus(game.name, locationName, 'eliminated');
        },
        revive(locationName: string) {
            return mutations.setStatus(game.name, locationName, 'caught');
        },
        evolve(locationName: string, toPokemonName: string) {
            return mutations.setPokemon(game.name, locationName, toPokemonName);
        },
        devolve(locationName: string, toPokemonName: string) {
            return mutations.setPokemon(game.name, locationName, toPokemonName);
        },
        moveToParty,
        moveToBox,
        moveToDeathBox,
        moveToSection(locationName: string, section: BoxSectionKind) {
            if (section === 'party') {
                return moveToParty(locationName);
            }
            if (section === 'death') {
                return moveToDeathBox(locationName);
            }
            return moveToBox(locationName);
        },
    };
}
