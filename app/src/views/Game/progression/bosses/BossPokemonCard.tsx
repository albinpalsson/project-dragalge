import { css } from '@pokedb2/css-in-js';
import { Badge } from '../../../../components/Badge';
import { PokemonStatsPanel } from '../../../../components/PokemonStatsPanel';
import { Tooltip } from '../../../../components/Tooltip';
import type {
    BossPokemonView,
    BossMoveView,
} from '../../../../db/pokemon-data/queries';
import { pokemonIconSrc, toIconSlug } from '../../../../pokemon-icon';

interface BossPokemonCardProps {
    pokemon: BossPokemonView;
}

export function BossPokemonCard({ pokemon }: BossPokemonCardProps) {
    return (
        <article className={card}>
            <div className={header}>
                <img
                    className={icon}
                    src={pokemonIconSrc(toIconSlug(pokemon.pokemonName))}
                    alt={pokemon.pokemonName}
                    loading="lazy"
                />
                <h4 className={pokemonName}>{pokemon.pokemonName}</h4>
                <Badge>Lv {pokemon.level}</Badge>
                <span className={types}>
                    {pokemon.primaryType}
                    {pokemon.secondaryType ? ` / ${pokemon.secondaryType}` : ''}
                </span>
            </div>
            <div className={content}>
                <p className={line}>
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

                {pokemon.moves.length > 0 && (
                    <div className={movesSection}>
                        <span className={label}>Moves:</span>
                        <div className={movesGrid}>
                            {pokemon.moves.map((move: BossMoveView) => (
                                <Tooltip key={move.name} content={move.effect}>
                                    <button
                                        type="button"
                                        className={moveName}
                                        title={move.name}
                                    >
                                        <span className={moveLabel}>
                                            {move.name}
                                        </span>
                                        <span className={moveType}>
                                            {move.type}
                                        </span>
                                        <span className={moveCategory}>
                                            {move.category}
                                        </span>
                                        {move.power > 0 && (
                                            <span className={movePower}>
                                                Pow {move.power}
                                            </span>
                                        )}
                                        {move.accuracy > 0 && (
                                            <span className={moveAccuracy}>
                                                Acc {move.accuracy}%
                                            </span>
                                        )}
                                    </button>
                                </Tooltip>
                            ))}
                        </div>
                    </div>
                )}

                <div className={statsSection}>
                    <h5 className={sectionTitle}>Base Stats</h5>
                    <PokemonStatsPanel baseStats={pokemon.baseStats} />
                </div>
            </div>
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
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border-bottom: 0.1rem solid var(--color-border);
`;

const icon = css`
    width: 3.2rem;
    height: 3.2rem;
`;

const pokemonName = css`
    flex: 1;
    font-size: var(--font-size-lg);
    font-weight: 600;
    margin: 0;
`;

const types = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;

const content = css`
    padding: var(--space-3);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
`;

const line = css`
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

const statsSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const movesSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
`;

const movesGrid = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
`;

const moveName = css`
    display: flex;
    gap: var(--space-2);
    align-items: center;
    padding: var(--space-2);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    cursor: pointer;
    text-align: left;
    flex-wrap: wrap;

    &:hover {
        background-color: var(--color-hover-overlay);
    }
`;

const moveLabel = css`
    font-weight: 600;
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

const sectionTitle = css`
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: 600;
    text-transform: uppercase;
    color: var(--color-text-muted);
`;
