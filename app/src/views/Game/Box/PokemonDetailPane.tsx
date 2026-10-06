import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../../components/Button';
import {
    OverflowMenu,
    OverflowMenuItem,
} from '../../../components/OverflowMenu';
import { PokemonStatsPanel } from '../../../components/PokemonStatsPanel';
import { TypeBadge } from '../../../components/TypeBadge';
import { NO_PARTY_SLOT } from '../../../db/game-db/schema';
import type { EncounterRollRow } from '../../../db/game-db/queries';
import { usePartyManager } from '../../../hooks/usePartyManager';
import { usePokemonEvolutionQuery, usePokemonQuery } from './queries';
import { PokemonEvolutionSection } from './PokemonEvolutionSection';
import { TypeDefenses } from './TypeDefenses';
import { useTypeDefenses } from '../useTypeDefenses';

interface PokemonDetailPaneProps {
    row: EncounterRollRow;
    party: EncounterRollRow[];
}

export function PokemonDetailPane({ row, party }: PokemonDetailPaneProps) {
    const [isReplacing, setIsReplacing] = useState(false);
    const pokemonQuery = usePokemonQuery(row.pokemon_name);
    const evolutionQuery = usePokemonEvolutionQuery(row.pokemon_name);
    const defensiveEntries = useTypeDefenses(
        pokemonQuery.data?.primaryType,
        pokemonQuery.data?.secondaryType,
    );
    const actions = usePartyManager();

    const isEliminated = row.status === 'eliminated';
    const isInParty = row.party_slot !== NO_PARTY_SLOT;
    const isPartyFull = actions.freeSlot === NO_PARTY_SLOT;

    return (
        <section className={pane} aria-label={`${row.pokemon_name} details`}>
            <div className={headerRow}>
                <div className={identity}>
                    <h4 className={heading}>{row.pokemon_name}</h4>
                    {pokemonQuery.data && (
                        <span className={types}>
                            <TypeBadge type={pokemonQuery.data.primaryType} />
                            {pokemonQuery.data.secondaryType && (
                                <TypeBadge
                                    type={pokemonQuery.data.secondaryType}
                                />
                            )}
                        </span>
                    )}
                </div>
                <div className={buttons}>
                    <OverflowMenu label="More options">
                        {isEliminated ? (
                            <OverflowMenuItem
                                disabled={actions.isBusy}
                                onClick={() =>
                                    void actions.revive(row.location_name)
                                }
                            >
                                Revive
                            </OverflowMenuItem>
                        ) : (
                            <>
                                {isInParty ? (
                                    <OverflowMenuItem
                                        disabled={actions.isBusy}
                                        onClick={() =>
                                            actions.removeFromParty(
                                                row.location_name,
                                            )
                                        }
                                    >
                                        Remove from party
                                    </OverflowMenuItem>
                                ) : (
                                    <OverflowMenuItem
                                        disabled={actions.isBusy || isPartyFull}
                                        onClick={() =>
                                            actions.addToParty(
                                                row.location_name,
                                            )
                                        }
                                    >
                                        Add to party
                                    </OverflowMenuItem>
                                )}
                                <OverflowMenuItem
                                    disabled={actions.isBusy}
                                    onClick={() =>
                                        void actions.eliminate(
                                            row.location_name,
                                        )
                                    }
                                >
                                    Eliminated
                                </OverflowMenuItem>
                                {evolutionQuery.data?.previousEvolutions.map(
                                    (evolution) => (
                                        <OverflowMenuItem
                                            key={`${evolution.pokemonName}-${evolution.method}`}
                                            disabled={actions.isBusy}
                                            onClick={() =>
                                                void actions.devolve(
                                                    row.location_name,
                                                    evolution.pokemonName,
                                                )
                                            }
                                        >
                                            Devolve to {evolution.pokemonName}
                                        </OverflowMenuItem>
                                    ),
                                )}
                                {!isInParty && isPartyFull && (
                                    <OverflowMenuItem
                                        disabled={actions.isBusy}
                                        onClick={() =>
                                            setIsReplacing(!isReplacing)
                                        }
                                    >
                                        Replace
                                    </OverflowMenuItem>
                                )}
                            </>
                        )}
                    </OverflowMenu>
                </div>
            </div>

            <div className={info}>
                {pokemonQuery.isPending && <p className={muted}>Loading...</p>}
                {pokemonQuery.isError && (
                    <p className={muted}>
                        Error loading Pokémon: {String(pokemonQuery.error)}
                    </p>
                )}
                {pokemonQuery.data && (
                    <>
                        {evolutionQuery.data && (
                            <PokemonEvolutionSection
                                evolutions={evolutionQuery.data.nextEvolutions}
                                isBusy={actions.isBusy}
                                onEvolve={(pokemonName) =>
                                    void actions.evolve(
                                        row.location_name,
                                        pokemonName,
                                    )
                                }
                            />
                        )}
                        <div className={detailsGrid}>
                            <section className={statsSection}>
                                <PokemonStatsPanel
                                    baseStats={pokemonQuery.data.baseStats}
                                />
                            </section>
                            {defensiveEntries.length > 0 && (
                                <TypeDefenses entries={defensiveEntries} />
                            )}
                        </div>
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

const pane = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  padding: var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const headerRow = css`
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    flex-basis: 100%;
`;

const identity = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
`;

const info = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
    flex: 1 1 100%;
`;

const detailsGrid = css`
    display: flex;
    flex-wrap: wrap;
        gap: var(--space-6);
`;

const statsSection = css`
    display: flex;
    flex: 1 1 28rem;
    flex-direction: column;
    gap: var(--space-2);
    max-width: 34rem;
`;

const heading = css`
  margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
`;

const types = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
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
    margin-left: auto;
`;

const replaceRow = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  flex-basis: 100%;
`;
