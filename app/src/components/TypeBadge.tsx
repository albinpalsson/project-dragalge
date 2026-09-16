import { css } from '@pokedb2/css-in-js';
import { getPokemonTypeColor } from '../utils/pokemon-type-colors';

interface TypeBadgeProps {
    type: string;
}

export function TypeBadge({ type }: TypeBadgeProps) {
    const color = getPokemonTypeColor(type);

    return (
        <span className={badge} style={{ borderColor: color, color }}>
            {type}
        </span>
    );
}

const badge = css`
    display: inline-flex;
    align-items: center;
    width: fit-content;
    padding: 0.2rem 0.5rem;
    border: 0.1rem solid;
    border-radius: var(--radius-sm);
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.2;
    text-transform: uppercase;
`;
