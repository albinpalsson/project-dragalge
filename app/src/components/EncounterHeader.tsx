import { css } from '@pokedb2/css-in-js';
import { Badge, BadgeButton } from './Badge';
import { ProgressionCardHeader } from './ProgressionCardHeader';
import type { LocationEncounterDetails } from '../db/pokemon-data/queries';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { formatEncounterGroupLevelRange } from '../utils/encounter-formatters';
import { useMemo } from 'react';

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
    const levelRange = useMemo(
        () => formatEncounterGroupLevelRange(encounters),
        [encounters],
    );

    return (
        <ProgressionCardHeader
            actions={
                <>
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
                </>
            }
        >
            <div>
                <h3 className={heading}>{location.name}</h3>
                <p className={subheading}>{location.province}</p>
            </div>
        </ProgressionCardHeader>
    );
}

const heading = css`
  margin: 0;
  font-size: var(--font-size-lg);
`;

const subheading = css`
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;
