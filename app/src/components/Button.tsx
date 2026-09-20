import type { ReactNode } from 'react';
import { css, cx } from '@pokedb2/css-in-js';

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'warm';
    type?: 'button' | 'submit';
    disabled?: boolean;
    className?: string;
    ariaLabel?: string;
    title?: string;
}

export function Button({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    disabled = false,
    className,
    ariaLabel,
    title,
}: ButtonProps) {
    return (
        <button
            type={type}
            aria-label={ariaLabel}
            title={title}
            className={cx(
                buttonBase,
                variant === 'secondary' && buttonSecondary,
                variant === 'warm' && buttonWarm,
                variant === 'primary' && buttonPrimary,
                disabled && buttonDisabled,
                className,
            )}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background-color 0.15s, box-shadow 0.15s;
`;

const buttonPrimary = css`
  background: var(--color-primary);
  color: var(--color-on-primary);

  &:hover {
    background: var(--color-primary-hover);
  }
`;

const buttonWarm = css`
  background: var(--color-accent-warm);
  color: var(--color-on-primary);

  &:hover {
    background: var(--color-accent-warm-hover);
  }
`;

const buttonSecondary = css`
  background: transparent;
  color: var(--color-text-muted);

  && {
    border: 0.1rem solid var(--color-border);
    box-shadow: none;
  }

  &:hover {
    background: var(--color-hover-overlay);
    color: var(--color-text);
  }
`;

const buttonDisabled = css`
  && {
    cursor: not-allowed;
    opacity: 0.5;
  }

`;
