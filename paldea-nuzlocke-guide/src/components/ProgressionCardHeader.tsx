import { css } from '@project-dragalge/css-in-js';
import type { ReactNode } from 'react';

interface ProgressionCardHeaderProps {
    children: ReactNode;
    actions?: ReactNode;
}

export function ProgressionCardHeader({
    children,
    actions,
}: ProgressionCardHeaderProps) {
    return (
        <header className={header}>
            <div className={content}>{children}</div>
            {actions && <div className={actionsStyle}>{actions}</div>}
        </header>
    );
}

const header = css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 0.1rem solid var(--color-border);
`;

const content = css`
    min-width: 0;
`;

const actionsStyle = css`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1);
`;
