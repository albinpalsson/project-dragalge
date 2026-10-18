import { css } from '@project-dragalge/css-in-js';
import { Button } from './Button';

interface EncounterTableToggleProps {
    expanded: boolean;
    count: number;
    onToggle: () => void;
}

export function EncounterTableToggle({
    expanded,
    count,
    onToggle,
}: EncounterTableToggleProps) {
    return (
        <div className={toggleRow}>
            <Button
                variant="secondary"
                className={borderlessToggle}
                onClick={onToggle}
                ariaLabel={expanded ? 'Hide encounters' : 'Show encounters'}
            >
                📋 {expanded ? 'Hide' : 'Show'} {count} encounters{' '}
                <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
            </Button>
        </div>
    );
}

const toggleRow = css`
  display: flex;
  justify-content: flex-start;
`;

const borderlessToggle = css`
    && {
        border: 0;
    }
`;
