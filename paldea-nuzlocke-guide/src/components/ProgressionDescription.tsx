import { css, cx } from '@project-dragalge/css-in-js';
import type { ReactNode } from 'react';

interface ProgressionDescriptionProps {
    children: ReactNode;
    className?: string;
}

export function ProgressionDescription({
    children,
    className,
}: ProgressionDescriptionProps) {
    return <p className={cx(description, className)}>{children}</p>;
}

const description = css`
    margin: 0;
    max-width: 46rem;
    padding: var(--space-2) 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    line-height: 1.45;
`;