import { css, cx } from '@pokedb2/css-in-js';
import type { EncounterStatus } from '../db/game-db/schema';

export type StatusChipState =
    | EncounterStatus
    | 'won'
    | 'lost'
    | 'pending-result';

interface StatusChipProps {
    status: StatusChipState;
}

export function StatusChip({ status }: StatusChipProps) {
    return (
        <span className={cx(chip, STATUS_CHIP_CLASS[status])}>
            {STATUS_LABELS[status]}
        </span>
    );
}

const STATUS_LABELS: Record<StatusChipState, string> = {
    pending: 'Rolled',
    caught: 'Caught',
    missed: 'Missed',
    eliminated: 'Eliminated',
    won: 'Won',
    lost: 'Lost',
    'pending-result': 'Pending',
};

const chip = css`
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-sm);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
`;

const chipPending = css`
  color: var(--color-text-muted);
  background: var(--color-hover-overlay);
`;

const chipCaught = css`
  color: var(--color-success);
  background: var(--color-success-bg);
`;

const chipMissed = css`
  color: var(--color-warning);
  background: var(--color-warning-bg);
`;

const chipEliminated = css`
  color: var(--color-danger);
  background: var(--color-danger-bg);
`;

const STATUS_CHIP_CLASS: Record<StatusChipState, string> = {
    pending: chipPending,
    caught: chipCaught,
    missed: chipMissed,
    eliminated: chipEliminated,
    won: chipCaught,
    lost: chipEliminated,
    'pending-result': chipPending,
};
