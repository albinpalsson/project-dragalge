import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../../components/Button';
import { OverflowMenu } from '../../../components/OverflowMenu';
import { PokemonStatsPanel } from '../../../components/PokemonStatsPanel';
import { TypeBadge } from '../../../components/TypeBadge';
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
            <div className={headerRow}>
                <div className={identity}>
                    <h4 className={heading}>{displayName}</h4>
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
                    {isEliminated ? (
                        <Button
                            variant="secondary"
                            disabled={actions.isBusy}
                            onClick={() =>
                                void actions.revive(row.location_name)
                            }
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
                                        actions.removeFromParty(
                                            row.location_name,
                                        )
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
                            <Button
                                variant="secondary"
                                ariaLabel="Eliminated"
                                title="Eliminated"
                                disabled={actions.isBusy}
                                onClick={() =>
                                    void actions.eliminate(row.location_name)
                                }
                            >
                                💀
                            </Button>
                            {!isInParty && isPartyFull && (
                                <OverflowMenu label="More Pokémon actions">
                                    <Button
                                        variant="secondary"
                                        disabled={actions.isBusy}
                                        onClick={() =>
                                            setIsReplacing(!isReplacing)
                                        }
                                    >
                                        Replace...
                                    </Button>
                                </OverflowMenu>
                            )}
                        </>
                    )}
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
                    <div className={detailsGrid}>
                        <section className={statsSection}>
                            <h5 className={sectionTitle}>Base Stats</h5>
                            <PokemonStatsPanel
                                baseStats={pokemonQuery.data.baseStats}
                            />
                        </section>
                        {defensiveEntries.length > 0 && (
                            <TypeDefenses entries={defensiveEntries} />
                        )}
                    </div>
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

const sectionTitle = css`
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
    margin-left: auto;
`;

const replaceRow = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-2);
  flex-basis: 100%;
`;
