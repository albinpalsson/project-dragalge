import {
    MAX_PARTY_SIZE,
    NO_PARTY_SLOT,
    type EncounterRollRow,
} from '../../../db/game-db/schema';

export type BoxSectionKind = 'party' | 'box' | 'death';

export interface BoxSections {
    party: EncounterRollRow[];
    stored: EncounterRollRow[];
    eliminated: EncounterRollRow[];
}

export function deriveBoxSections(encounters: EncounterRollRow[]): BoxSections {
    return {
        party: encounters
            .filter((row) => row.party_slot !== NO_PARTY_SLOT)
            .sort((a, b) => a.party_slot - b.party_slot),
        stored: encounters.filter(
            (row) =>
                row.status === 'caught' && row.party_slot === NO_PARTY_SLOT,
        ),
        eliminated: encounters.filter((row) => row.status === 'eliminated'),
    };
}

export function getBoxSectionForRow(
    row: EncounterRollRow,
): BoxSectionKind | undefined {
    if (row.status === 'eliminated') {
        return 'death';
    }
    if (row.status === 'caught' && row.party_slot !== NO_PARTY_SLOT) {
        return 'party';
    }
    if (row.status === 'caught') {
        return 'box';
    }
    return undefined;
}

interface DropRuleInput {
    row: EncounterRollRow;
    targetSection: BoxSectionKind;
    party: EncounterRollRow[];
}

export function canDropPokemon({ row, targetSection, party }: DropRuleInput): {
    allowed: boolean;
    reason?: string;
} {
    const currentSection = getBoxSectionForRow(row);
    if (!currentSection || currentSection === targetSection) {
        return { allowed: false };
    }
    if (targetSection === 'party' && party.length >= MAX_PARTY_SIZE) {
        return { allowed: false, reason: 'Party is full' };
    }
    return { allowed: true };
}
