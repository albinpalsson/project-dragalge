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
