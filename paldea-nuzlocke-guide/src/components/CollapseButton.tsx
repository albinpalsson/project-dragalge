import { css } from '@project-dragalge/css-in-js';

interface CollapseButtonProps {
    onClick: () => void;
    label: string;
}

export function CollapseButton({ onClick, label }: CollapseButtonProps) {
    return (
        <button
            type="button"
            className={button}
            onClick={onClick}
            aria-label={label}
            title={label}
            aria-expanded={true}
        >
            <span aria-hidden="true">▾</span>
        </button>
    );
}

const button = css`
    display: inline-flex;
    align-items: center;
    padding: var(--space-1) var(--space-2);
    background: transparent;
    border: 0;
    color: var(--color-text-muted);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;
`;
