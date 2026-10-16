import { css, cx } from '@pokedb2/css-in-js';
import type { ReactNode } from 'react';

interface BadgeProps {
    children: ReactNode;
    className?: string;
    uppercase?: boolean;
}

interface BadgeButtonProps {
    children: ReactNode;
    onClick: () => void;
    className?: string;
    ariaLabel?: string;
    title?: string;
    disabled?: boolean;
    ariaExpanded?: boolean;
}

export function Badge({ children, className, uppercase }: BadgeProps) {
    return (
        <span className={cx(base, uppercase && uppercaseText, className)}>
            {children}
        </span>
    );
}

export function BadgeButton({
    children,
    onClick,
    className,
    ariaLabel,
    title,
    disabled,
    ariaExpanded,
}: BadgeButtonProps) {
    return (
        <button
            type="button"
            className={cx(base, interactive, className)}
            onClick={onClick}
            aria-label={ariaLabel}
            title={title}
            disabled={disabled}
            aria-expanded={ariaExpanded}
        >
            {children}
        </button>
    );
}

const base = css`
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const uppercaseText = css`
  text-transform: uppercase;
`;

const interactive = css`
  background: transparent;
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }

    &:disabled {
        color: var(--color-text-muted);
        opacity: 0.5;
        cursor: not-allowed;
    }
`;
