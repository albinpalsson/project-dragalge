import { css } from '@pokedb2/css-in-js';
import type { EncounterRollDetails } from '../hooks/useEncounterRoll';
import { pokemonIconSrc, toIconSlug } from '../pokemon-icon';
import {
    formatLevelRange,
    formatTime,
    formatWeight,
} from '../utils/encounter-formatters';

const STATUS_LABELS: Record<EncounterRollDetails['status'], string> = {
    pending: 'Rolled',
    caught: 'Caught',
    missed: 'Missed',
    eliminated: 'Eliminated',
};

interface RollResultProps {
    encounterRoll: EncounterRollDetails | undefined;
}

export function RollResult({ encounterRoll }: RollResultProps) {
    if (!encounterRoll) {
        return (
            <p className={mutedText}>
                Randomize or pick an encounter from the list.
            </p>
        );
    }

    return (
        <div className={rollBox}>
            <img
                className={rollIcon}
                src={pokemonIconSrc(toIconSlug(encounterRoll.name))}
                alt={encounterRoll.name}
                loading="lazy"
            />
            <div>
                <p className={rollTitle}>
                    {STATUS_LABELS[encounterRoll.status]} {encounterRoll.name}
                </p>
                <p className={rollMeta}>
                    Lv {formatLevelRange(encounterRoll)} ·{' '}
                    {encounterRoll.subArea} · {formatWeight(encounterRoll)}% ·{' '}
                    {formatTime(encounterRoll)}
                </p>
            </div>
        </div>
    );
}

const mutedText = css`
  margin: 0;
  color: var(--color-text-muted);
`;

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
