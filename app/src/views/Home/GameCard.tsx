import { css } from '@pokedb2/css-in-js';
import type { GameRunRow } from '../../db/game-db/schema';
import { pokemonIconSrc } from '../../pokemon-icon';

const STARTERS = ['sprigatito', 'fuecoco', 'quaxly'];

interface GameCardProps {
    game: GameRunRow;
}

export function GameCard({ game }: GameCardProps) {
    const starter = STARTERS[Math.floor(Math.random() * STARTERS.length)];
    const progress = Math.floor(Math.random() * 100);
    const variantColor =
        game.variant === 'v' ? 'var(--color-accent)' : 'var(--color-primary)';

    return (
        <div className={card}>
            <div
                className={fill}
                style={{
                    width: `${progress}%`,
                    backgroundImage: `repeating-linear-gradient(45deg, color-mix(in srgb, ${variantColor} 35%, transparent), color-mix(in srgb, ${variantColor} 35%, transparent) 0.6rem, color-mix(in srgb, ${variantColor} 20%, transparent) 0.6rem, color-mix(in srgb, ${variantColor} 20%, transparent) 1.2rem)`,
                }}
            />
            <span className={name}>{game.id}</span>
            <span className={progressLabel}>{progress}%</span>
            <img
                className={icon}
                src={pokemonIconSrc(starter)}
                alt={starter}
                loading="lazy"
            />
        </div>
    );
}

const card = css`
  position: relative;
  overflow: hidden;
  width: 36rem;
  aspect-ratio: 3 / 2;
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const fill = css`
  position: absolute;
  inset: 0 auto 0 0;
`;

const name = css`
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const progressLabel = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const icon = css`
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  width: 8rem;
  height: 8rem;
`;
