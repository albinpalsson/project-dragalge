import { css } from '@project-dragalge/css-in-js';
import type { BossMoveView } from '../db/pokemon-data/queries';
import { Tooltip } from './Tooltip';
import { TypeBadge } from './TypeBadge';

interface MoveCardProps {
    move: BossMoveView;
}

export function MoveCard({ move }: MoveCardProps) {
    return (
        <div className={card}>
            <div className={nameRow}>
                <Tooltip content={move.effect}>
                    <button
                        type="button"
                        className={nameTrigger}
                        aria-label={`${move.name} description`}
                        title={`${move.name} description`}
                    >
                        <span className={name}>{move.name}</span>
                        <span aria-hidden="true">*</span>
                    </button>
                </Tooltip>
            </div>
            <span className={details}>
                <TypeBadge type={move.type} />
                <Tooltip
                    content={getMoveCategoryDescription(move.category)}
                    className={categoryTooltip}
                >
                    <button
                        type="button"
                        className={category}
                        aria-label={move.category}
                        title={move.category}
                    >
                        <MoveCategoryIcon category={move.category} />
                    </button>
                </Tooltip>
            </span>
            <span className={metric}>
                {move.power > 0 && `BP ${move.power}`}
                {move.power > 0 && move.accuracy > 0 && ' | '}
                {move.accuracy > 0 && `${move.accuracy}% acc`}
            </span>
        </div>
    );
}

function getMoveCategoryDescription(category: string): string {
    const normalizedCategory = category.toLowerCase();
    return `${normalizedCategory.charAt(0).toUpperCase()}${normalizedCategory.slice(1)} move`;
}

function MoveCategoryIcon({ category }: { category: string }) {
    switch (category.toLowerCase()) {
        case 'physical':
            return (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="m10.75 2.25 3 3-6.5 6.5-2.15.65.65-2.15 6.5-6.5Z" />
                    <path d="m5.2 9.7 1.1 1.1M3 12.9l2.05-2.05 1.1 1.1L4.1 14M4.4 8.35l3.25 3.25M3.25 7.25l1.4 1.4M6.5 10.5l1.4 1.4" />
                </svg>
            );
        case 'special':
            return (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M2 8h7M3.5 5.75h5M3.5 10.25h5" />
                    <circle cx="11.75" cy="8" r="2.25" />
                    <path d="M14.5 8h.01" />
                </svg>
            );
        case 'status':
            return (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <path d="M8 2.25a5.75 5.75 0 1 1 0 11.5 2.9 2.9 0 0 0 0-5.8 2.9 2.9 0 0 1 0-5.7Z" />
                    <circle
                        cx="8"
                        cy="5.15"
                        r=".8"
                        fill="currentColor"
                        stroke="none"
                    />
                    <circle
                        cx="8"
                        cy="10.85"
                        r=".8"
                        fill="currentColor"
                        stroke="none"
                    />
                </svg>
            );
        default:
            return (
                <svg viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="8" cy="8" r="5.5" />
                    <path d="M6.5 6.5a1.6 1.6 0 1 1 2.6 1.25c-.8.6-1.1.9-1.1 1.75M8 11.75h.01" />
                </svg>
            );
    }
}

const card = css`
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text);
    text-align: left;
`;

const nameRow = css`
    display: flex;
    align-items: center;
    gap: 0.2rem;
    min-width: 0;
`;

const name = css`
    overflow: hidden;
    font-weight: 700;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const nameTrigger = css`
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    gap: 0.2rem;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text);
    cursor: pointer;
    font: inherit;
    line-height: 1;

    &:hover {
        color: var(--color-primary-hover);
    }
`;

const details = css`
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
`;

const category = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.8rem;
    height: 1.8rem;
    padding: 0;
    border: none;
    background: none;
    color: var(--color-text-muted);
    cursor: pointer;

    &:hover {
        color: var(--color-primary-hover);
    }

    & svg {
        width: 1.5rem;
        height: 1.5rem;
        fill: none;
        stroke: currentColor;
        stroke-linecap: round;
        stroke-linejoin: round;
        stroke-width: 1.35;
    }

`;

const categoryTooltip = css`
    & [role="tooltip"] {
        width: max-content;
        min-width: 0;
    }
`;

const metric = css`
    color: var(--color-text-secondary);
    font-size: 1.2rem;
    font-weight: 500;
    white-space: nowrap;
`;
