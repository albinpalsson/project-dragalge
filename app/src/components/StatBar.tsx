import { css } from '@pokedb2/css-in-js';

interface StatBarProps {
    label: string;
    value: number;
    max?: number;
}

export function StatBar({ label, value, max = 200 }: StatBarProps) {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
        <div className={stat}>
            <div className={heading}>
                <span className={labelClass}>{label}</span>
                <span className={valueClass}>{value}</span>
            </div>
            <div
                className={track}
                role="progressbar"
                aria-label={`${label}: ${value}`}
                aria-valuemin={0}
                aria-valuemax={max}
                aria-valuenow={value}
            >
                <div
                    className={fill}
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: getStatColor(value),
                    }}
                />
            </div>
        </div>
    );
}

function getStatColor(value: number): string {
    if (value < 60) {
        return 'var(--color-danger)';
    }
    if (value < 90) {
        return 'var(--color-accent-warm)';
    }

    if (value < 130) {
        return 'var(--color-success)';
    }
    return 'var(--color-excellent)';
}

const stat = css`
    min-width: 0;
`;

const heading = css`
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: var(--space-1);
    margin-bottom: 0.5rem;
`;

const labelClass = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: 500;
    white-space: nowrap;
`;

const valueClass = css`
    font-size: var(--font-size-sm);
    font-weight: 600;
`;

const track = css`
    height: 0.6rem;
    overflow: hidden;
    border-radius: var(--radius-sm);
    background: var(--color-bg);
`;

const fill = css`
    height: 100%;
    border-radius: inherit;
`;
