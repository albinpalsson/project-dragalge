import { css } from '@pokedb2/css-in-js';
import { StatusChip } from '../../../../components/StatusChip';

interface BossResultControlsProps {
    currentResult?: 'won' | 'lost';
    showTeam: boolean;
    onToggleTeam: () => void;
    onResolve: (result: 'won' | 'lost') => Promise<void>;
    onClear: () => Promise<void>;
    isBusy: boolean;
}

export function BossResultControls({
    currentResult,
    showTeam,
    onToggleTeam,
    onResolve,
    onClear,
    isBusy,
}: BossResultControlsProps) {
    return (
        <div className={container}>
            <div className={buttonGroup}>
                <button
                    type="button"
                    className={iconButton}
                    disabled={isBusy}
                    onClick={onToggleTeam}
                    aria-label={showTeam ? 'Hide team' : 'Show team'}
                    title={showTeam ? 'Hide team' : 'Show team'}
                >
                    👥
                </button>
                <button
                    type="button"
                    className={iconButton}
                    disabled={isBusy || currentResult === 'won'}
                    onClick={() => void onResolve('won')}
                    aria-label="Mark won"
                    title="Mark won"
                >
                    🏆
                </button>
                <button
                    type="button"
                    className={iconButton}
                    disabled={isBusy || currentResult === 'lost'}
                    onClick={() => void onResolve('lost')}
                    aria-label="Mark lost"
                    title="Mark lost"
                >
                    💀
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
            <div className={resultSection}>
                <span className={label}>Result</span>
                <StatusChip status={currentResult ?? 'pending-result'} />
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

const resultSection = css`
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
`;

const label = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;
