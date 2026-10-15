import { css } from '@pokedb2/css-in-js';
import { useState } from 'react';
import { Badge } from '../../../../components/Badge';
import { Modal } from '../../../../components/Modal';
import { MoveCard } from '../../../../components/MoveCard';
import {
    PokemonIcon,
    type PokemonIconSize,
} from '../../../../components/PokemonIcon';
import { PokemonStatsPanel } from '../../../../components/PokemonStatsPanel';
import { TypeBadge } from '../../../../components/TypeBadge';
import { Tooltip } from '../../../../components/Tooltip';
import type { BossRosterPokemon } from './BossRoster';
import { TypeDefenses } from '../../Box/TypeDefenses';

interface BossPokemonCardProps {
    pokemon: BossRosterPokemon;
    teraType?: string;
    iconSize: PokemonIconSize;
    zoomedIcon?: boolean;
}

export function BossPokemonCard({
    pokemon,
    teraType,
    iconSize,
    zoomedIcon,
}: BossPokemonCardProps) {
    const [isTypeDefensesOpen, setIsTypeDefensesOpen] = useState(false);
    const displayName = pokemon.displayName ?? pokemon.pokemonName;
    const defensivePrimaryType = teraType?.toLowerCase() ?? pokemon.primaryType;
    const defensiveSecondaryType = teraType ? undefined : pokemon.secondaryType;

    return (
        <article className={card}>
            <div className={header}>
                <PokemonIcon
                    name={pokemon.pokemonName}
                    alt={displayName}
                    size={iconSize}
                    zoomed={zoomedIcon}
                />
                <div className={identity}>
                    <div className={identityLine}>
                        <span className={pokemonName}>{displayName}</span>
                        <span className={types}>
                            <TypeBadge type={pokemon.primaryType} />
                            {pokemon.secondaryType && (
                                <TypeBadge type={pokemon.secondaryType} />
                            )}
                            {teraType && (
                                <Tooltip
                                    content={`Terastallizes into the ${teraType} type: its defensive typing becomes ${teraType}, it keeps STAB from its original types, and gains boosted STAB on ${teraType}-type moves.`}
                                >
                                    <button
                                        type="button"
                                        className={teraTrigger}
                                        title={`Terastallizes to ${teraType}`}
                                        aria-label={`${displayName} Terastallizes to ${teraType}`}
                                    >
                                        <TypeBadge
                                            type={teraType}
                                            variant="tera"
                                        />
                                    </button>
                                </Tooltip>
                            )}
                        </span>
                        <button
                            type="button"
                            title="View type defenses"
                            className={typeDefenseTrigger}
                            aria-label={`${displayName} type defenses`}
                            onClick={() => setIsTypeDefensesOpen(true)}
                        >
                            ▦
                        </button>
                    </div>
                    <p className={abilityLine}>
                        <Badge>Lv {pokemon.level}</Badge>
                    </p>
                    <p className={abilityLine}>
                        <span className={label}>Ability:</span>{' '}
                        <Tooltip content={pokemon.ability.description}>
                            <button
                                type="button"
                                className={detailButton}
                                title={pokemon.ability.name}
                            >
                                {pokemon.ability.name}
                            </button>
                        </Tooltip>
                    </p>
                </div>
            </div>
            <div className={content}>
                <div className={detailsGrid}>
                    <section className={detailsSection}>
                        <PokemonStatsPanel
                            baseStats={pokemon.baseStats}
                            equivalent={pokemon.equivalentBaseStats}
                        />
                    </section>
                    {pokemon.moves.length > 0 && (
                        <section className={detailsSection}>
                            <h5 className={sectionTitle}>Moves</h5>
                            <div className={movesGrid}>
                                {pokemon.moves.map((move) => (
                                    <MoveCard key={move.name} move={move} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            </div>
            {isTypeDefensesOpen && (
                <Modal
                    title={`${displayName} ${teraType ? `(${teraType} Tera)` : ''}`}
                    onClose={() => setIsTypeDefensesOpen(false)}
                >
                    <TypeDefenses
                        primaryType={defensivePrimaryType}
                        secondaryType={defensiveSecondaryType}
                    />
                </Modal>
            )}
        </article>
    );
}

const card = css`
    position: relative;
    width: 100%;
    max-width: 34rem;
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: visible;
    background: var(--color-surface);

    &:hover {
        z-index: 1;
    }

    &:focus-within {
        z-index: 1;
    }
`;

const header = css`
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
`;

const identity = css`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
    gap: var(--space-1);
`;

const identityLine = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
`;

const pokemonName = css`
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0 var(--space-1) 0 0;
`;

const typeDefenseTrigger = css`
    display: inline-grid;
    place-items: center;
    flex: 0 0 auto;
    width: 2.4rem;
    height: 2.4rem;
    padding: 0;
    border: none;
    border-radius: var(--radius-md);
    background: none;
    color: var(--color-text);
    cursor: pointer;
    font-size: var(--font-size-lg);

    &:hover {
        background: var(--color-hover-overlay);
    }
`;

const types = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
`;

const teraTrigger = css`
    display: inline-flex;
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
`;

const content = css`
    padding: 0 var(--space-2) var(--space-2);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const abilityLine = css`
    margin: 0;
`;

const label = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const detailButton = css`
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text);
    font-size: var(--font-size-base);
    text-decoration: underline;
    cursor: pointer;
`;

const detailsGrid = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
`;

const detailsSection = css`
    display: flex;
    flex-direction: column;
    flex: 1 1 28rem;
    min-width: 0;
    gap: var(--space-2);
    padding-top: var(--space-1);
`;

const movesGrid = css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    row-gap: var(--space-4);
    column-gap: var(--space-2);
`;

const sectionTitle = css`
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
    margin: 0;
    padding-bottom: var(--space-1);
    border-bottom: 0.1rem solid var(--color-border);
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
`;
