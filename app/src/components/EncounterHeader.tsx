import { css } from '@pokedb2/css-in-js';
import { Badge, BadgeButton } from './Badge';
import type { LocationEncounterDetails } from '../db/pokemon-data/queries';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { formatEncounterGroupLevelRange } from '../utils/encounter-formatters';

interface EncounterHeaderProps {
    location: LocationEncounterDetails['location'];
    encounters: LocationEncounterView[];
    canCollapse?: boolean;
    onCollapse?: () => void;
}

export function EncounterHeader({
    location,
    encounters,
    canCollapse,
    onCollapse,
}: EncounterHeaderProps) {
    const levelRange = formatEncounterGroupLevelRange(encounters);

    return (
        <header className={header}>
            <div>
                <h3 className={heading}>{location.name}</h3>
                <p className={subheading}>{location.region}</p>
            </div>
            <div className={badges}>
                <Badge>{location.province}</Badge>
                {levelRange && <Badge>Lv {levelRange}</Badge>}
                {canCollapse && onCollapse && (
                    <BadgeButton
                        ariaLabel="Collapse encounter"
                        title="Collapse encounter"
                        onClick={onCollapse}
                    >
                        ▾ Fold
                    </BadgeButton>
                )}
            </div>
        </header>
    );
}

const header = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-lg);
`;

const subheading = css`
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const badges = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1);
`;
