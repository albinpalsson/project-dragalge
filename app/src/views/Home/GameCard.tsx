import { css } from '@pokedb2/css-in-js';
import type { GameRunRow } from '../../db/game-db/schema';
import type { PokemonRow } from '@pokedb2/pokemon-data';
import { pokemonIconSrc } from '../../pokemon-icon';

interface GameCardProps {
    game: GameRunRow;
  caughtPokemon: PokemonRow[];
}

export function GameCard({ game, caughtPokemon }: GameCardProps) {
  const progress = Math.min(caughtPokemon.length * 8, 100);
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
            <span className={progressLabel}>{caughtPokemon.length} caught</span>
            {caughtPokemon.length > 0 ? (
              <span className={icons}>
                {caughtPokemon.slice(0, 6).map((pokemon) => (
                  <img
                    key={pokemon.id}
                    className={icon}
                    src={pokemonIconSrc(toSlug(pokemon.name))}
                    alt={pokemon.name}
                    loading="lazy"
                  />
                ))}
              </span>
            ) : (
              <span className={emptyText}>No caught Pokémon</span>
            )}
        </div>
    );
}

      function toSlug(name: string): string {
        return name.toLowerCase();
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

const icons = css`
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  display: flex;
  flex-direction: row-reverse;
  align-items: center;
  gap: var(--space-1);
`;

const icon = css`
  width: 5.6rem;
  height: 5.6rem;
`;

const emptyText = css`
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;
