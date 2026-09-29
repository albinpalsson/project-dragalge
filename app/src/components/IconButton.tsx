import type { ReactNode } from 'react';
import { css, cx } from '@pokedb2/css-in-js';

interface IconButtonProps {
    label: string;
    onClick: () => void;
    children: ReactNode;
    className?: string;
}

export function IconButton({
    label,
    onClick,
    children,
    className,
}: IconButtonProps) {
    return (
        <button
            type="button"
            className={cx(iconButton, className)}
            onClick={onClick}
            aria-label={label}
            title={label}
        >
            {children}
        </button>
    );
}

const iconButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 3.6rem;
  height: 3.6rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-lg);
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--color-hover-overlay);
  }

  &:focus-visible {
    outline: 0.2rem solid var(--color-accent);
    outline-offset: 0.1rem;
  }
`;
