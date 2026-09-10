import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../../components/Button';
import {
    NO_PARTY_SLOT,
    type EncounterRollRow,
} from '../../../db/game-db/schema';
import type { PokemonBaseStats } from '../../../db/pokemon-data/queries';
import { usePartyManager } from '../../../hooks/usePartyManager';
import { usePokemonQuery, useTypeDefenses } from './queries';
import { TypeDefenses } from './TypeDefenses';

interface PokemonDetailPaneProps {
    row: EncounterRollRow;
    party: EncounterRollRow[];
}

export function PokemonDetailPane({ row, party }: PokemonDetailPaneProps) {
    const [isReplacing, setIsReplacing] = useState(false);
    const pokemonQuery = usePokemonQuery(row.pokemon_name);
    const defensiveEntries = useTypeDefenses(row.pokemon_name);
    const actions = usePartyManager();

    const isEliminated = row.status === 'eliminated';
    const isInParty = row.party_slot !== NO_PARTY_SLOT;
    const isPartyFull = actions.freeSlot === NO_PARTY_SLOT;

    return (
        <section className={pane} aria-label={`${row.pokemon_name} details`}>
            <div className={info}>
                <h4 className={heading}>{row.pokemon_name}</h4>
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
                        <dl className={stats}>
                            {statEntries(pokemonQuery.data.baseStats).map(
                                ([label, value]) => (
                                    <div className={stat} key={label}>
                                        <dt className={muted}>{label}</dt>
                                        <dd className={statValue}>{value}</dd>
                                    </div>
                                ),
                            )}
                        </dl>
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
                            {member.pokemon_name}
                        </Button>
                    ))}
                </div>
            )}
        </section>
    );
}

function statEntries(baseStats: PokemonBaseStats): [string, number][] {
    return [
        ['HP', baseStats.hp],
        ['Attack', baseStats.attack],
        ['Defense', baseStats.defense],
        ['Sp. Atk', baseStats.specialAttack],
        ['Sp. Def', baseStats.specialDefense],
        ['Speed', baseStats.speed],
    ];
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

const stats = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  margin: 0;
`;

const stat = css`
  display: flex;
  flex-direction: column;
`;

const statValue = css`
  margin: 0;
  font-weight: var(--font-weight-bold);
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
