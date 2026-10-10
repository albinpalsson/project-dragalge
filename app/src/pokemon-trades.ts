import { getEncounterGroupKey } from './pokemon-species';

export interface PokemonTradeOffer {
    requestedPokemon: string;
    requestedLabel: string;
    receivedPokemon: string;
    receivedLabel: string;
    receivedLevel: number;
    npcLocation: string;
    npcDescription: string;
    matchForms?: boolean;
}

const POKEMON_TRADE_OFFERS: readonly PokemonTradeOffer[] = [
    {
        requestedPokemon: 'Flabébé',
        requestedLabel: 'Flabébé',
        receivedPokemon: 'Snom',
        receivedLabel: 'Snom',
        receivedLevel: 10,
        npcLocation: 'Cortondo',
        npcDescription: 'a girl on the main path of the city',
        matchForms: true,
    },
    {
        requestedPokemon: 'Wooper (Paldean Form)',
        requestedLabel: 'Paldean Wooper',
        receivedPokemon: 'Wooper',
        receivedLabel: 'Johtonian Wooper',
        receivedLevel: 18,
        npcLocation: 'Cascarrafa',
        npcDescription: 'a trainer next to the center fountain',
    },
    {
        requestedPokemon: 'Pincurchin',
        requestedLabel: 'Pincurchin',
        receivedPokemon: 'Gengar',
        receivedLabel: 'Gengar',
        receivedLevel: 25,
        npcLocation: 'Levincia',
        npcDescription: 'a trainer on the bridges near the battle court',
    },
];

export function getPokemonTradeOffer(
    pokemonName: string,
): PokemonTradeOffer | undefined {
    return POKEMON_TRADE_OFFERS.find((offer) =>
        offer.matchForms
            ? getEncounterGroupKey(pokemonName) === offer.requestedPokemon
            : pokemonName === offer.requestedPokemon,
    );
}
