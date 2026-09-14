import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../../components/Button';
import { OverflowMenu } from '../../../components/OverflowMenu';
import { PokemonStatsPanel } from '../../../components/PokemonStatsPanel';
import {
    NO_PARTY_SLOT,
    type EncounterRollRow,
} from '../../../db/game-db/schema';
import { usePartyManager } from '../../../hooks/usePartyManager';
import { getRandomizerDisplayName } from '../../../randomizer-groups';
import { usePokemonQuery, useTypeDefenses } from './queries';
import { TypeDefenses } from './TypeDefenses';

interface PokemonDetailPaneProps {
    row: EncounterRollRow;
    party: EncounterRollRow[];
}

export function PokemonDetailPane({ row, party }: PokemonDetailPaneProps) {
    const [isReplacing, setIsReplacing] = useState(false);
    const displayName = getRandomizerDisplayName(row.pokemon_name);
    const pokemonQuery = usePokemonQuery(row.pokemon_name);
    const defensiveEntries = useTypeDefenses(row.pokemon_name);
    const actions = usePartyManager();

    const isEliminated = row.status === 'eliminated';
    const isInParty = row.party_slot !== NO_PARTY_SLOT;
    const isPartyFull = actions.freeSlot === NO_PARTY_SLOT;

    return (
        <section className={pane} aria-label={`${displayName} details`}>
            <div className={info}>
                <h4 className={heading}>{displayName}</h4>
                {pokemonQuery.isPending && <p className={muted}>Loading...</p>}
                {pokemonQuery.isError && (
                    <p className={muted}>
                        Error loading Pokémon: {String(pokemonQuery.error)}
                    </p>
                )}
                {pokemonQuery.data && (
                    <>
                        <p className={muted}>
                            {pokemonQuery.data.primaryType}
                            {pokemonQuery.data.secondaryType
                                ? ` / ${pokemonQuery.data.secondaryType}`
                                : ''}
                        </p>
                        <PokemonStatsPanel
                            baseStats={pokemonQuery.data.baseStats}
                        />
                    </>
                )}
                {defensiveEntries.length > 0 && (
                    <TypeDefenses entries={defensiveEntries} />
                )}
            </div>

            <div className={buttons}>
                {isEliminated ? (
                    <Button
                        variant="secondary"
                        disabled={actions.isBusy}
                        onClick={() => void actions.revive(row.location_name)}
                    >
                        Revive
                    </Button>
                ) : (
                    <>
                        {isInParty ? (
                            <Button
                                variant="secondary"
                                disabled={actions.isBusy}
                                onClick={() =>
                                    actions.removeFromParty(row.location_name)
                                }
                            >
                                Remove from party
                            </Button>
                        ) : (
                            <Button
                                variant="secondary"
                                disabled={actions.isBusy || isPartyFull}
                                onClick={() =>
                                    actions.addToParty(row.location_name)
                                }
                            >
                                Add to party
                            </Button>
                        )}
                        <OverflowMenu label="More Pokémon actions">
                            {!isInParty && isPartyFull && (
                                <Button
                                    variant="secondary"
                                    disabled={actions.isBusy}
                                    onClick={() => setIsReplacing(!isReplacing)}
                                >
                                    Replace...
                                </Button>
                            )}
                            <Button
                                variant="secondary"
                                disabled={actions.isBusy}
                                onClick={() =>
                                    void actions.eliminate(row.location_name)
                                }
                            >
                                Mark eliminated
                            </Button>
                        </OverflowMenu>
                    </>
                )}
            </div>

            {isReplacing && !isInParty && isPartyFull && (
                <div className={replaceRow}>
                    <span className={muted}>Swap out:</span>
                    {party.map((member) => (
                        <Button
                            key={member.location_name}
                            variant="secondary"
                            disabled={actions.isBusy}
                            onClick={() => {
                                setIsReplacing(false);
                                void actions.replacePartyMember(
                                    member.location_name,
                                    row.location_name,
                                );
                            }}
                        >
                            {getRandomizerDisplayName(member.pokemon_name)}
                        </Button>
                    ))}
                </div>
            )}
        </section>
    );
}

const pane = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const info = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1 1 24rem;
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-base);
`;

const muted = css`
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const buttons = css`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: var(--space-2);
`;

const replaceRow = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  flex-basis: 100%;
`;
