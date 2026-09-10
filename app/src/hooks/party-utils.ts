import {
    MAX_PARTY_SIZE,
    NO_PARTY_SLOT,
    type EncounterRollRow,
} from '../db/game-db/schema';

export function nextFreePartySlot(encounters: EncounterRollRow[]): number {
    const taken = new Set(encounters.map((row) => row.party_slot));
    for (let slot = 1; slot <= MAX_PARTY_SIZE; slot++) {
        if (!taken.has(slot)) {
            return slot;
        }
    }
    return NO_PARTY_SLOT;
}
