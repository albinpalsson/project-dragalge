import { css } from '@pokedb2/css-in-js';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import type { EncounterRollDetails } from '../hooks/useEncounterRoll';
import { formatEncounterGroupLevelRange } from '../utils/encounter-formatters';
import { Badge } from './Badge';
import { CollapsedSummaryRow } from './CollapsedSummaryRow';
import { PokemonIcon } from './PokemonIcon';
import { StatusChip } from './StatusChip';
import { useMemo } from 'react';

interface EncounterCollapsedSummaryProps {
    areaName: string;
    locationName: string;
    encounterRoll: EncounterRollDetails | undefined;
    encounters: LocationEncounterView[];
    isNext?: boolean;
    zoomedIcon?: boolean;
    onExpand: () => void;
}

// Compact row shown once an encounter resolves, standing in for the full card.
export function EncounterCollapsedSummary({
    areaName,
    locationName,
    encounterRoll,
    encounters,
    isNext,
    zoomedIcon,
    onExpand,
}: EncounterCollapsedSummaryProps) {
    const levelRange = useMemo(
        () => formatEncounterGroupLevelRange(encounters),
        [encounters],
    );

    return (
        <CollapsedSummaryRow
            icon={
                encounterRoll ? (
                    <PokemonIcon
                        name={encounterRoll.name}
                        alt={encounterRoll.displayName}
                        size="sm"
                        zoomed={zoomedIcon}
                    />
                ) : (
                    <span className={placeholderIcon} aria-hidden="true">
                        ?
                    </span>
                )
            }
            title={locationName}
            detail={encounterRoll ? encounterRoll.displayName : undefined}
            leftBadges={
                encounterRoll ? (
                    <StatusChip status={encounterRoll.status} />
                ) : undefined
            }
            rightBadges={
                <>
                    <Badge>{areaName}</Badge>
                    {levelRange && <Badge>Lv {levelRange}</Badge>}
                </>
            }
            isNext={isNext}
            onExpand={onExpand}
        />
    );
}

const placeholderIcon = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
  width: 3.2rem;
  height: 3.2rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-alt);
    color: var(--color-text-muted);
    font-size: var(--font-size-lg);
    font-weight: 600;
`;
