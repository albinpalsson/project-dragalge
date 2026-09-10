import { css } from '@pokedb2/css-in-js';
import type { DefensiveEffectivenessEntry } from '../../../utils/type-effectiveness';

interface TypeDefensesProps {
    entries: DefensiveEffectivenessEntry[];
}

function getCanonicalName(multiplier: number): string {
    switch (multiplier) {
        case 0:
            return 'Immune';
        case 0.25:
            return 'Resistant';
        case 0.5:
            return 'Resistant';
        case 2:
            return 'Weak';
        case 4:
            return 'Weak';
        default:
            return 'Unknown';
    }
}

export function TypeDefenses({ entries }: TypeDefensesProps) {
    if (entries.length === 0) {
        return null;
    }

    return (
        <div className={container}>
            <h5 className={title}>Type Defenses</h5>
            <div className={list}>
                {entries.map((entry) => (
                    <div
                        className={row}
                        key={entry.attackingType}
                        title={`${entry.attackingType}: ${entry.multiplier}×`}
                    >
                        <span className={typeName}>{entry.attackingType}</span>
                        <span className={multiplier}>
                            {getCanonicalName(entry.multiplier)} ({' '}
                            {entry.multiplier}× )
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const container = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1 1 100%;
`;

const title = css`
  margin: 0;
  font-size: var(--font-size-base);
`;

const list = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-2);
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-sm);
`;

const row = css`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: var(--font-size-sm);
`;

const typeName = css`
  flex: 1;
`;

const multiplier = css`
  margin-left: auto;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
`;
