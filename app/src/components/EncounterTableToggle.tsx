import { css } from '@pokedb2/css-in-js';
import { Button } from './Button';

interface EncounterTableToggleProps {
    expanded: boolean;
    onToggle: () => void;
}

export function EncounterTableToggle({
    expanded,
    onToggle,
}: EncounterTableToggleProps) {
    return (
        <div className={toggleRow}>
            <Button variant="secondary" onClick={onToggle}>
                {expanded ? 'Hide encounters' : 'Show encounters'}
            </Button>
        </div>
    );
}

const toggleRow = css`
  display: flex;
  justify-content: flex-start;
`;
