import { css } from '@project-dragalge/css-in-js';
import { getPokemonTradeOffer } from '../pokemon-trades';
import { useEvolutionGraphQuery } from '../hooks/useEvolutionGraphQuery';
import type { EncounterRoll } from '../hooks/useEncounterRoll';
import { Button } from './Button';

interface EncounterTradeProps {
    encounterRoll: EncounterRoll | undefined;
    disabled: boolean;
    onTradePokemon: (pokemonName: string) => void;
}

export function EncounterTrade({
    encounterRoll,
    disabled,
    onTradePokemon,
}: EncounterTradeProps) {
    const evolutionGraphQuery = useEvolutionGraphQuery();

    if (!encounterRoll || !('activeName' in encounterRoll)) {
        return null;
    }

    const offer = getPokemonTradeOffer(encounterRoll.name);
    if (!offer) {
        return null;
    }

    const isTraded =
        encounterRoll.activeName === offer.receivedPokemon ||
        evolutionGraphQuery.data
            ?.getEvolutionFamily(encounterRoll.activeName)
            .includes(offer.receivedPokemon) === true;

    return (
        <div className={tradeRow}>
            <p className={tradeText}>
                {offer.requestedLabel} can be traded for a {offer.receivedLabel}{' '}
                (Lv. {offer.receivedLevel}) in {offer.npcLocation} from{' '}
                {offer.npcDescription}. Mark trade here to change the species in
                your box.
            </p>
            <Button
                variant="secondary"
                onClick={() =>
                    onTradePokemon(
                        isTraded ? encounterRoll.name : offer.receivedPokemon,
                    )
                }
                disabled={disabled}
            >
                {isTraded ? 'Undo trade' : 'Trade'}
            </Button>
        </div>
    );
}

const tradeRow = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
`;

const tradeText = css`
    margin: 0;
    max-width: 46rem;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;
