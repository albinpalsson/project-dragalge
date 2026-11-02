import { nextFreePartySlot } from '../db/game-db/party-slots';
import { NO_PARTY_SLOT } from '../db/game-db/schema';
import { pickEncounterSpecies } from '../pokemon-species';
import { useGame } from '../views/Game/GameContext';
import { useEncounterMutations } from './useEncounterMutations';
import { track } from '../analytics/analytics';

function trackProgression(locationName: string, outcome: string): void {
    track({ name: 'progression_milestone', milestone: locationName, outcome });
}

export function useEncounterActions() {
    const game = useGame();
    const mutations = useEncounterMutations();

    return {
        isBusy: mutations.isBusy,
        rollEncounter(pokemonName: string, locationName: string) {
            return mutations.addRoll(
                game.name,
                locationName,
                pickEncounterSpecies(pokemonName),
            );
        },
        async catchEncounter(locationName: string) {
            await mutations.setStatus(game.name, locationName, 'caught', {
                assignPartySlot: true,
            });
            trackProgression(locationName, 'caught');
        },
        async skipEncounter(locationName: string) {
            await mutations.skip(game.name, locationName);
            trackProgression(locationName, 'skipped');
        },
        async missEncounter(locationName: string) {
            await mutations.setStatus(game.name, locationName, 'missed');
            trackProgression(locationName, 'missed');
        },
        async releaseStarter(locationName: string) {
            await mutations.setStatus(game.name, locationName, 'released');
            trackProgression(locationName, 'released');
        },
        async trade(locationName: string, pokemonName: string) {
            await mutations.setPokemon(game.name, locationName, pokemonName);
        },
        async chooseStarter(
            pokemonName: string,
            locationName: string = '__starter__',
        ) {
            const slot = nextFreePartySlot(game.encounters);
            await mutations.addRoll(
                game.name,
                locationName,
                pickEncounterSpecies(pokemonName),
                'caught',
            );
            trackProgression('Starter', 'chosen');
            if (slot !== NO_PARTY_SLOT) {
                await mutations.setPartySlot(game.name, locationName, slot);
            }
        },
        clearEncounter(locationName: string) {
            return mutations.clear(game.name, locationName);
        },
    };
}
