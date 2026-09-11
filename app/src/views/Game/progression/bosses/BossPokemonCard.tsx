import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { PokemonStatsPanel } from '../../../../components/PokemonStatsPanel';
import type {
    BossPokemonView,
    BossMoveView,
} from '../../../../db/pokemon-data/queries';

interface BossPokemonCardProps {
    pokemon: BossPokemonView;
}

function MoveCard({ move }: { move: BossMoveView }) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className={moveCard}>
            <button
                type="button"
                className={moveName}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <span className={moveLabel}>{move.name}</span>
                <span className={moveType}>{move.type}</span>
                <span className={moveCategory}>{move.category}</span>
                {move.power > 0 && (
                    <span className={movePower}>Pow: {move.power}</span>
                )}
                {move.accuracy > 0 && (
                    <span className={moveAccuracy}>Acc: {move.accuracy}%</span>
                )}
            </button>
            {isExpanded && (
                <p className={moveEffect}>
                    <em>{move.effect}</em>
                </p>
            )}
        </div>
    );
}

export function BossPokemonCard({ pokemon }: BossPokemonCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <article className={card}>
            <button
                type="button"
                className={header}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h4 className={pokemonName}>{pokemon.pokemonName}</h4>
                <span className={level}>Lv {pokemon.level}</span>
                <span className={types}>
                    {pokemon.primaryType}
                    {pokemon.secondaryType ? ` / ${pokemon.secondaryType}` : ''}
                </span>
                <span className={ability}>{pokemon.ability.name}</span>
            </button>

            {isExpanded && (
                <div className={content}>
                    <div className={statsSection}>
                        <h5 className={sectionTitle}>Base Stats</h5>
                        <PokemonStatsPanel baseStats={pokemon.baseStats} />
                    </div>

                    <div className={abilitySection}>
                        <h5 className={sectionTitle}>{pokemon.ability.name}</h5>
                        <p className={abilityDescription}>
                            {pokemon.ability.description}
                        </p>
                    </div>

                    {pokemon.moves.length > 0 && (
                        <div className={movesSection}>
                            <h5 className={sectionTitle}>Moves</h5>
                            <div className={movesGrid}>
                                {pokemon.moves.map((move: BossMoveView) => (
                                    <MoveCard key={move.name} move={move} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

const card = css`
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-surface);
`;

const header = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    padding: var(--space-3);
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background-color: var(--color-hover-overlay);
    }
`;

const pokemonName = css`
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
`;

const level = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;

const types = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;

const ability = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-style: italic;
`;

const content = css`
    padding: var(--space-3);
    border-top: 0.1rem solid var(--color-border);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
`;

const statsSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const abilitySection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const abilityDescription = css`
    margin: 0;
    font-size: var(--font-size-sm);
    line-height: 1.5;
    color: var(--color-text);
`;

const movesSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const movesGrid = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const moveCard = css`
    display: flex;
    flex-direction: column;
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    background: var(--color-bg);
`;

const moveName = css`
    display: flex;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2);
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    transition: background-color 0.2s;
    flex-wrap: wrap;

    &:hover {
        background-color: var(--color-hover-overlay);
    }
`;

const moveLabel = css`
    font-weight: 600;
    flex: 1;
    min-width: 100px;
`;

const moveType = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    padding: 0.25rem 0.5rem;
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    text-transform: capitalize;
`;

const moveCategory = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    padding: 0.25rem 0.5rem;
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    text-transform: capitalize;
`;

const movePower = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    white-space: nowrap;
`;

const moveAccuracy = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    white-space: nowrap;
`;

const moveEffect = css`
    margin: 0;
    padding: var(--space-2);
    font-size: var(--font-size-sm);
    line-height: 1.5;
    color: var(--color-text);
    border-top: 0.1rem solid var(--color-border);
`;

const sectionTitle = css`
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
`;
