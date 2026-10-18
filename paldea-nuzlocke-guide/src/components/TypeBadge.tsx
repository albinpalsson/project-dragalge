import { css, cx } from '@project-dragalge/css-in-js';
import { getPokemonTypeColor } from '../utils/pokemon-type-colors';

interface TypeBadgeProps {
    type: string;
    variant?: 'type' | 'tera';
}

export function TypeBadge({ type, variant = 'type' }: TypeBadgeProps) {
    const color = getPokemonTypeColor(type);

    return (
        <span
            className={cx(badge, variant === 'tera' && teraBadge)}
            style={{ borderColor: color, color }}
        >
            {variant === 'tera' && (
                <span aria-hidden="true" className={sparkle}>
                    ✦
                </span>
            )}
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

const teraBadge = css`
    gap: 0.2rem;
    border-style: dashed;
`;

const sparkle = css`
    font-size: 1rem;
`;
