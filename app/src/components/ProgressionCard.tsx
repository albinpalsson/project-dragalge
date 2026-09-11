import { css, cx } from '@pokedb2/css-in-js';
import type { ReactNode } from 'react';

interface ProgressionCardProps {
    children: ReactNode;
    // Faded state for a resolved/won encounter or battle.
    dimmed?: boolean;
    // Tighter spacing used by cards with denser content.
    compact?: boolean;
    ariaLabelledBy?: string;
}

export function ProgressionCard({
    children,
    dimmed,
    compact,
    ariaLabelledBy,
}: ProgressionCardProps) {
    return (
        <article
            className={cx(card, compact && compactCard, dimmed && dimmedCard)}
            aria-labelledby={ariaLabelledBy}
        >
            {children}
        </article>
    );
}

const card = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    background: var(--color-surface);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
`;

const compactCard = css`
    && {
        gap: var(--space-2);
        padding: var(--space-3);
    }
`;

const dimmedCard = css`
    && {
        opacity: 0.6;
    }
`;
