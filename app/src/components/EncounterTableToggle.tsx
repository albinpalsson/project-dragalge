import { css } from '@pokedb2/css-in-js';
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
                onClick={onToggle}
                ariaLabel={expanded ? 'Hide encounters' : 'Show encounters'}
            >
                📋 {count} encounters{' '}
                <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
            </Button>
        </div>
    );
}

const toggleRow = css`
  display: flex;
  justify-content: flex-start;
`;
