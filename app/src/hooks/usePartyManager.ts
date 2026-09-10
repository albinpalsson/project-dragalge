import { NO_PARTY_SLOT } from '../db/game-db/schema';
import type { BoxSectionKind } from '../views/Game/Box/box-model';
import { useGame } from '../views/Game/GameContext';
import { nextFreePartySlot } from './party-utils';
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

        if (row.status === 'eliminated') {
            await mutations.setStatus(game.id, locationName, 'caught');
        }
        if (row.party_slot !== NO_PARTY_SLOT) {
            return true;
        }

        const slot = nextFreePartySlot(game.encounters);
        if (slot === NO_PARTY_SLOT) {
            return false;
        }
        await mutations.setPartySlot(game.id, locationName, slot);
        return true;
    };

    const moveToBox = async (locationName: string): Promise<boolean> => {
        const row = game.encounters.find(
            (encounter) => encounter.location_name === locationName,
        );
        if (!row) {
            return false;
        }

        if (row.party_slot !== NO_PARTY_SLOT) {
            await mutations.setPartySlot(game.id, locationName, NO_PARTY_SLOT);
        }
        if (row.status === 'eliminated') {
            await mutations.setStatus(game.id, locationName, 'caught');
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
        await mutations.setPartySlot(game.id, locationName, NO_PARTY_SLOT);
        await mutations.setStatus(game.id, locationName, 'eliminated');
        return true;
    };

    return {
        isBusy: mutations.isBusy,
        freeSlot: nextFreePartySlot(game.encounters),
        addToParty: moveToParty,
        removeFromParty(locationName: string) {
            return mutations.setPartySlot(game.id, locationName, NO_PARTY_SLOT);
        },
        async replacePartyMember(outgoing: string, incoming: string) {
            const row = game.encounters.find(
                (entry) => entry.location_name === outgoing,
            );
            if (!row) {
                return;
            }
            await mutations.setPartySlot(game.id, outgoing, NO_PARTY_SLOT);
            await mutations.setPartySlot(game.id, incoming, row.party_slot);
        },
        async eliminate(locationName: string) {
            await mutations.setPartySlot(game.id, locationName, NO_PARTY_SLOT);
            await mutations.setStatus(game.id, locationName, 'eliminated');
        },
        revive(locationName: string) {
            return mutations.setStatus(game.id, locationName, 'caught');
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
