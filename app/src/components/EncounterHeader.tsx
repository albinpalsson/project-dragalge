import { css } from '@pokedb2/css-in-js';
import { Badge, BadgeButton } from './Badge';
import { ProgressionCardHeader } from './ProgressionCardHeader';
import type { LocationEncounterDetails } from '../db/pokemon-data/queries';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import {
    isEncounterRollResolved,
    type EncounterRoll,
} from '../hooks/useEncounterRoll';
import {
    formatEncounterGroupLevelRange,
    formatLocationName,
} from '../utils/encounter-formatters';
import { useMemo } from 'react';

interface EncounterHeaderProps {
    location: LocationEncounterDetails['location'];
    encounters: LocationEncounterView[];
    encounterRoll: EncounterRoll | undefined;
    canCollapse?: boolean;
    onCollapse?: () => void;
}

export function EncounterHeader({
    location,
    encounters,
    encounterRoll,
    canCollapse,
    onCollapse,
}: EncounterHeaderProps) {
    const levelRange = useMemo(
        () => formatEncounterGroupLevelRange(encounters),
        [encounters],
    );
    const isResolved = isEncounterRollResolved(encounterRoll);

    return (
        <ProgressionCardHeader
            actions={
                <>
                    {!isResolved && levelRange && (
                        <Badge>Lv {levelRange}</Badge>
                    )}
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
                <h3 className={heading}>{formatLocationName(location.name)}</h3>
                <p className={subheading}>
                    {formatLocationName(location.province)}
                </p>
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
