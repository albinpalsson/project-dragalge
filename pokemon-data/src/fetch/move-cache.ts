// Starmobile signature moves have no in-game description; text is from Bulbapedia's Effect section.
export const MOVE_DESCRIPTION_CACHE: Record<string, string | undefined> = {
    'Wicked Torque':
        'Inflicts damage and has a 10% chance of putting the target to sleep.',
    'Blazing Torque':
        'Inflicts damage and has a 30% chance of burning the target.',
    'Noxious Torque':
        'Inflicts damage and has a 30% chance of poisoning the target.',
    'Magical Torque':
        'Inflicts damage and has a 30% chance of confusing the target.',
    'Combat Torque':
        'Inflicts damage and has a 30% chance of paralyzing the target.',
};

export interface MoveStatOverride {
    power?: number;
    accuracy?: number;
}

// Scarlet/Violet values for moves whose Bulbapedia infobox shows a newer game's
// value (e.g. {{tt|80|70 prior to Champions}}). Add an entry when the build
// reports a move's power or accuracy as ambiguous.
export const MOVE_STAT_OVERRIDES: Record<string, MoveStatOverride | undefined> =
    {
        Slash: { power: 70 },
        Crabhammer: { accuracy: 90 },
    };
