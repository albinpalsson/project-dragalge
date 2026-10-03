import { css } from '@pokedb2/css-in-js';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { useBanReasons } from '../hooks/useBanReasons';
import { getBanReason } from '../utils/ban-list';
import {
    formatLevelRange,
    formatTime,
    formatWeight,
} from '../utils/encounter-formatters';

interface EncounterTableProps {
    encounters: LocationEncounterView[];
    disabled: boolean;
    onPick: (encounter: LocationEncounterView) => void;
}

export function EncounterTable({
    encounters,
    disabled,
    onPick,
}: EncounterTableProps) {
    const banReasons = useBanReasons();
    return (
        <div className={tableWrap}>
            <table className={table}>
                <thead>
                    <tr>
                        <th>Pokemon</th>
                        <th>Sub-area</th>
                        <th>Levels</th>
                        <th>Spawn rate</th>
                        <th>Time</th>
                        <th>Terrain</th>
                        <th>Pick</th>
                    </tr>
                </thead>
                <tbody>
                    {encounters.map((encounter) => {
                        const banReason = getBanReason(
                            banReasons,
                            encounter.name,
                        );
                        const isPickDisabled = disabled || !!banReason;

                        return (
                            <tr
                                key={`${encounter.name}-${encounter.subArea}-${encounter.terrain}`}
                                className={banReason ? excludedRow : undefined}
                            >
                                <td>
                                    <span
                                        className={
                                            banReason ? excludedName : undefined
                                        }
                                    >
                                        {encounter.name}
                                    </span>
                                    {banReason && (
                                        <span className={exclusionReason}>
                                            ({banReason})
                                        </span>
                                    )}
                                </td>
                                <td>{encounter.subArea}</td>
                                <td>{formatLevelRange(encounter)}</td>
                                <td>{formatWeight(encounter)}%</td>
                                <td>{formatTime(encounter)}</td>
                                <td>{encounter.terrain}</td>
                                <td>
                                    <button
                                        type="button"
                                        className={pickButton}
                                        onClick={() => onPick(encounter)}
                                        disabled={isPickDisabled}
                                        aria-label={`Pick ${encounter.name}`}
                                    >
                                        🎣
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

const tableWrap = css`
  overflow-x: auto;
`;

const table = css`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    padding: var(--space-1) var(--space-2);
    border-bottom: 0.1rem solid var(--color-border);
    text-align: left;
    white-space: nowrap;
  }

  th {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-bold);
  }

  tbody tr:nth-child(odd) {
    background: var(--color-surface-alt);
  }
`;

const pickButton = css`
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
  cursor: pointer;

    &:disabled {
        color: var(--color-text-muted);
        opacity: 0.45;
        cursor: not-allowed;
    }
`;

const excludedRow = css`
    opacity: 0.6;
`;

const excludedName = css`
    text-decoration: line-through;
`;

const exclusionReason = css`
    display: block;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

