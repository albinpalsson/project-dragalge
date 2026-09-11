import { css, cx } from '@pokedb2/css-in-js';
import { Button } from '../../../../components/Button';

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
    const hasResult = currentResult !== undefined;

    return (
        <div className={container}>
            {!hasResult ? (
                <div className={buttonGroup}>
                    <Button
                        disabled={isBusy}
                        onClick={() => void onResolve('won')}
                    >
                        Mark Won
                    </Button>
                    <Button
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => void onResolve('lost')}
                    >
                        Mark Lost
                    </Button>
                </div>
            ) : (
                <div className={resultSection}>
                    <div className={result}>
                        <span className={label}>Battle Result:</span>
                        <span
                            className={cx(
                                resultBadge,
                                currentResult === 'won'
                                    ? resultBadgeWon
                                    : resultBadgeLost,
                            )}
                        >
                            {currentResult === 'won' ? '✓ Won' : '✗ Lost'}
                        </span>
                    </div>
                    <Button
                        variant="secondary"
                        disabled={isBusy}
                        onClick={() => void onClear()}
                    >
                        Clear Result
                    </Button>
                </div>
            )}
        </div>
    );
}

const container = css`
    padding: var(--space-3);
    background: var(--color-surface);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
`;

const buttonGroup = css`
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
`;

const resultSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const result = css`
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    background: var(--color-bg);
    border-radius: var(--radius-md);
`;

const label = css`
    font-weight: 600;
    color: var(--color-text-muted);
`;

const resultBadge = css`
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-weight: 600;
    color: white;
`;

const resultBadgeWon = css`
    background-color: #22c55e;
`;

const resultBadgeLost = css`
    background-color: #ef4444;
`;
