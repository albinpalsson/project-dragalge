import { css, cx } from '@project-dragalge/css-in-js';
import { pokemonIconSrc, toIconSlug } from '../pokemon-icon';

export type PokemonIconSize = 'sm' | 'md' | 'lg' | 'option' | 'xl';

interface PokemonIconProps {
    name: string;
    alt?: string;
    size: PokemonIconSize;
    /** Crops the sprite's transparent margin so the Pokémon looks bigger. */
    zoomed?: boolean;
    borderColor?: string;
}

export function PokemonIcon({
    name,
    alt,
    size,
    zoomed,
    borderColor,
}: PokemonIconProps) {
    const img = (className: string) => (
        <img
            className={className}
            src={pokemonIconSrc(toIconSlug(name))}
            alt={alt ?? name}
            loading="lazy"
        />
    );

    if (!zoomed) {
        return img(sizeClasses[size]);
    }

    return (
        <span
            className={cx(frame, sizeClasses[size], borderColor && bordered)}
            style={borderColor ? { borderColor } : undefined}
        >
            {img(zoomedImage)}
        </span>
    );
}

const sizeSm = css`
    width: 3.2rem;
    height: 3.2rem;
    --pokemon-icon-pad-x: 0.12rem;
    --pokemon-icon-pad-top: 0.08rem;
    --pokemon-icon-pad-bottom: 0.18rem;
    --pokemon-icon-scale: 1.17;
    --pokemon-icon-nudge: 0.04rem;
`;

const sizeMd = css`
    width: 3.6rem;
    height: 3.6rem;
    --pokemon-icon-pad-x: 0.12rem;
    --pokemon-icon-pad-top: 0.08rem;
    --pokemon-icon-pad-bottom: 0.18rem;
    --pokemon-icon-scale: 1.17;
    --pokemon-icon-nudge: 0.04rem;
`;

const sizeLg = css`
    width: 5.6rem;
    height: 5.6rem;
    --pokemon-icon-pad-x: 0.3rem;
    --pokemon-icon-pad-top: 0.24rem;
    --pokemon-icon-pad-bottom: 0.4rem;
    --pokemon-icon-scale: 1.17;
    --pokemon-icon-nudge: 0.08rem;
`;

const sizeOption = css`
    width: 6.4rem;
    height: 6.4rem;
    --pokemon-icon-pad-x: 0.3rem;
    --pokemon-icon-pad-top: 0.24rem;
    --pokemon-icon-pad-bottom: 0.4rem;
    --pokemon-icon-scale: 1.24;
    --pokemon-icon-nudge: 0.08rem;
`;

const sizeXl = css`
    width: 8rem;
    height: 8rem;
    --pokemon-icon-pad-x: 0.3rem;
    --pokemon-icon-pad-top: 0.24rem;
    --pokemon-icon-pad-bottom: 0.4rem;
    --pokemon-icon-scale: 1.17;
    --pokemon-icon-nudge: 0.08rem;
`;

const sizeClasses: Record<PokemonIconSize, string> = {
    sm: sizeSm,
    md: sizeMd,
    lg: sizeLg,
    option: sizeOption,
    xl: sizeXl,
};

const frame = css`
    padding: var(--pokemon-icon-pad-top) var(--pokemon-icon-pad-x)
        var(--pokemon-icon-pad-bottom) var(--pokemon-icon-pad-x);
    border-radius: var(--radius-sm);
    overflow: hidden;
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;
    flex-shrink: 0;
`;

const bordered = css`
    border: 0.1rem solid;
`;

const zoomedImage = css`
    width: 100%;
    height: 100%;
    transform: translateY(
            calc(-1 * (var(--pokemon-icon-pad-top) + var(--pokemon-icon-nudge)))
        )
        scale(var(--pokemon-icon-scale));
    transform-origin: center bottom;
`;
