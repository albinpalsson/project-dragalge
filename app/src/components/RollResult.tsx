import { css } from '@pokedb2/css-in-js';
import type { EncounterRollDetails } from '../hooks/useEncounterRoll';
import { pokemonIconSrc, toIconSlug } from '../pokemon-icon';
import { StatusChip } from './StatusChip';
import {
    formatLevelRange,
    formatRareWeight,
    formatSubAreaTerrain,
    formatTime,
} from '../utils/encounter-formatters';

interface RollResultProps {
    encounterRoll: EncounterRollDetails | undefined;
}

export function RollResult({ encounterRoll }: RollResultProps) {
    if (!encounterRoll) {
        return null;
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
            <img
                className={rollIcon}
                src={pokemonIconSrc(toIconSlug(encounterRoll.name))}
                alt={encounterRoll.displayName}
                loading="lazy"
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

const rollIcon = css`
  width: 5.6rem;
  height: 5.6rem;
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
