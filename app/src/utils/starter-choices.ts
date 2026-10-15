export const STARTER_CHOICES = [
    { name: 'Sprigatito', type: 'Grass' },
    { name: 'Fuecoco', type: 'Fire' },
    { name: 'Quaxly', type: 'Water' },
] as const;

export const STARTER_NAMES = STARTER_CHOICES.map(
    (starterChoice) => starterChoice.name,
) as [
    (typeof STARTER_CHOICES)[0]['name'],
    (typeof STARTER_CHOICES)[1]['name'],
    (typeof STARTER_CHOICES)[2]['name'],
];

const NEMONA_STARTER: Record<string, string> = {
    Sprigatito: 'Quaxly',
    Fuecoco: 'Sprigatito',
    Quaxly: 'Fuecoco',
};

export function getNemonaStarterChoice(playerStarterName: string) {
    const starterChoice = STARTER_CHOICES.find(
        (choice) => choice.name === NEMONA_STARTER[playerStarterName],
    );
    if (!starterChoice) {
        throw Error(`No Nemona starter found for ${playerStarterName}`);
    }
    return starterChoice;
}
