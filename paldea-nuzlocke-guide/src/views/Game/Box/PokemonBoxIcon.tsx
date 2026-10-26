import type { PointerEventHandler } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';
import { pokemonIconSrc, toIconSlug } from '../../../pokemon-icon';

export interface PokemonBoxIconDragProps {
    onPointerDown?: PointerEventHandler<HTMLButtonElement>;
    onPointerMove?: PointerEventHandler<HTMLButtonElement>;
    onPointerUp?: PointerEventHandler<HTMLButtonElement>;
    onPointerCancel?: PointerEventHandler<HTMLButtonElement>;
}

interface PokemonBoxIconProps extends PokemonBoxIconDragProps {
    pokemonName: string;
    isSelected: boolean;
    isDragging?: boolean;
    onSelect: () => void;
}

export function PokemonBoxIcon({
    pokemonName,
    isSelected,
    isDragging = false,
    onSelect,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
}: PokemonBoxIconProps) {
    return (
        <button
            type="button"
            className={cx(
                iconButton,
                isSelected && iconButtonSelected,
                isDragging && iconButtonDragging,
            )}
            aria-pressed={isSelected}
            onClick={onSelect}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerCancel}
            onContextMenu={(event) => event.preventDefault()}
        >
            <img
                className={icon}
                src={pokemonIconSrc(toIconSlug(pokemonName))}
                alt={pokemonName}
                draggable={false}
                loading="lazy"
            />
        </button>
    );
}

const iconButton = css`
  display: inline-flex;
  padding: 0;
  border: 0.2rem solid transparent;
  border-radius: var(--radius-md);
  background: transparent;
  cursor: pointer;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;

const iconButtonSelected = css`
  && {
    border-color: var(--color-primary);
  }
`;

const iconButtonDragging = css`
  && {
    opacity: 0.35;
  }
`;

const icon = css`
  width: 5.6rem;
  height: 5.6rem;
`;
