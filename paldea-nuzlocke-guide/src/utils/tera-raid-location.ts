// Tera Raid encounters are stored as ordinary `encounter_rolls` rows. Since a single star
// tier can hold more than one Pokémon in "unlimited" mode, the star rating and a per-tier
// sequence number are both encoded into the row's `location_name` instead of adding a table.
const STAR_SYMBOL = '★';
const LOCATION_PATTERN = /^Tera Raid (\d)★ #(\d+)$/;

// Bulbapedia's standard star-rating table: the level a raid Pokémon is caught at.
// See https://bulbapedia.bulbagarden.net/wiki/Tera_Raid_Battle
export const TERA_RAID_CAUGHT_LEVELS: Record<number, number> = {
    1: 12,
    2: 20,
    3: 35,
    4: 45,
    5: 75,
    6: 75,
};

export interface ParsedTeraRaidLocation {
    stars: number;
    sequence: number;
}

export function formatTeraRaidLocationName(
    stars: number,
    sequence: number,
): string {
    return `Tera Raid ${stars}${STAR_SYMBOL} #${sequence}`;
}

export function formatTeraRaidDisplayName(stars: number): string {
    return `Tera Raid ${STAR_SYMBOL.repeat(stars)} (${stars}-star)`;
}

export function parseTeraRaidLocationName(
    locationName: string,
): ParsedTeraRaidLocation | undefined {
    const match = LOCATION_PATTERN.exec(locationName);
    if (!match) {
        return undefined;
    }
    return { stars: Number(match[1]), sequence: Number(match[2]) };
}

// Lowest unused sequence number for this star tier, so unlimited raids never collide.
export function nextTeraRaidSequence(
    existingLocationNames: readonly string[],
    stars: number,
): number {
    const usedSequences = new Set(
        existingLocationNames
            .map(parseTeraRaidLocationName)
            .filter((parsed) => parsed?.stars === stars)
            .map((parsed) => parsed?.sequence),
    );
    let sequence = 1;
    while (usedSequences.has(sequence)) {
        sequence += 1;
    }
    return sequence;
}
