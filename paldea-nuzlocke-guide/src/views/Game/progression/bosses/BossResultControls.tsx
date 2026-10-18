import { css, cx } from '@project-dragalge/css-in-js';

interface BossResultControlsProps {
    currentResult?: 'won' | 'lost';
    onResolve: (result: 'won' | 'lost') => Promise<void>;
    onClear: () => Promise<void>;
    isBusy: boolean;
}

export function BossResultControls({
    currentResult,
    onResolve,
    onClear,
    isBusy,
}: BossResultControlsProps) {
    return (
        <div className={container}>
            <div className={buttonGroup}>
                <button
                    type="button"
                    className={cx(resultButton, wonButton)}
                    disabled={isBusy || currentResult === 'won'}
                    onClick={() => void onResolve('won')}
                    aria-label="Mark won"
                    title="Mark won"
                >
                    🏆 Mark won
                </button>
                <button
                    type="button"
                    className={cx(resultButton, lostButton)}
                    disabled={isBusy || currentResult === 'lost'}
                    onClick={() => void onResolve('lost')}
                    aria-label="Mark lost"
                    title="Mark lost"
                >
                    💀 Mark lost
                </button>
                <button
                    type="button"
                    className={iconButton}
                    disabled={isBusy || currentResult === undefined}
                    onClick={() => void onClear()}
                    aria-label="Clear result"
                    title="Clear result"
                >
                    ↺
                </button>
            </div>
        </div>
    );
}

const container = css`
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
    padding-top: var(--space-1);
    padding-bottom: var(--space-1);
`;

const buttonGroup = css`
    display: flex;
    gap: var(--space-2);
`;

const iconButton = css`
    width: 3.2rem;
    height: 3.2rem;
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--color-text);
    font-size: var(--font-size-base);
    cursor: pointer;

    &:hover {
        background: var(--color-hover-overlay);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const resultButton = css`
    min-height: 3.2rem;
    padding: 0 var(--space-2);
    border: 0.1rem solid;
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    font-weight: 600;

    &:hover {
        background: var(--color-hover-overlay);
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

const wonButton = css`
    border-color: var(--color-success);
    background: var(--color-success-bg);
    color: var(--color-success);
`;

const lostButton = css`
    border-color: var(--color-danger);
    background: var(--color-danger-bg);
    color: var(--color-danger);
`;
