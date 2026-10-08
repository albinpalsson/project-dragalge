import { css } from '@pokedb2/css-in-js';
import type { EncounterRoll } from '../hooks/useEncounterRoll';
import { PokemonIcon } from './PokemonIcon';
import { StatusChip } from './StatusChip';
import {
    formatLevelRange,
    formatRareWeight,
    formatSubAreaTerrain,
    formatTime,
} from '../utils/encounter-formatters';

interface RollResultProps {
    encounterRoll: EncounterRoll | undefined;
    zoomedIcon?: boolean;
}

export function RollResult({ encounterRoll, zoomedIcon }: RollResultProps) {
    if (
        !encounterRoll ||
        encounterRoll.status === 'notRolled' ||
        encounterRoll.status === 'skipped'
    ) {
        return (
            <div className={rollBox}>
                <span className={emptyRollIcon} aria-hidden="true">
                    ?
                </span>
            </div>
        );
    }

    const time = formatTime(encounterRoll);
    const metaParts = [
        `Lv ${formatLevelRange(encounterRoll)}`,
        `Found in ${formatSubAreaTerrain(encounterRoll.subAreaTerrains)}`,
        formatRareWeight(encounterRoll),
        time !== 'All' ? time : undefined,
    ].filter((part): part is string => Boolean(part));

    return (
        <div className={rollBox}>
            <PokemonIcon
                name={encounterRoll.name}
                alt={encounterRoll.displayName}
                size="lg"
                zoomed={zoomedIcon}
            />
            <div>
                <p className={rollTitle}>
                    {encounterRoll.displayName}{' '}
                    <StatusChip status={encounterRoll.status} />
                </p>
                <p className={rollMeta}>{metaParts.join(' · ')}</p>
            </div>
        </div>
    );
}

const rollBox = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const emptyRollIcon = css`
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 5.6rem;
        height: 5.6rem;
        border-radius: var(--radius-sm);
        background: var(--color-surface-alt);
        color: var(--color-text-muted);
        font-size: 3.2rem;
        font-weight: 600;
        line-height: 1;
`;

const rollTitle = css`
  margin: 0;
  font-weight: var(--font-weight-bold);
`;

const rollMeta = css`
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;
