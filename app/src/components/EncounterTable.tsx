import { css } from '@pokedb2/css-in-js';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { Tooltip } from './Tooltip';
import {
    formatLevelRange,
    formatTime,
    formatWeight,
} from '../utils/encounter-formatters';
import {
    isEncounterInVariant,
    variantDisplayName,
} from '../utils/game-variant';

interface EncounterTableProps {
    encounters: LocationEncounterView[];
    variant: string;
    disabled: boolean;
    onPick: (encounter: LocationEncounterView) => void;
}

export function EncounterTable({
    encounters,
    variant,
    disabled,
    onPick,
}: EncounterTableProps) {
    return (
        <div className={tableWrap}>
            <table className={table}>
                <thead>
                    <tr>
                        <th>Pokemon</th>
                        <th>Sub-area</th>
                        <th>Levels</th>
                        <th>Weight</th>
                        <th>Time</th>
                        <th>Terrain</th>
                        <th>Pick</th>
                    </tr>
                </thead>
                <tbody>
                    {encounters.map((encounter) => {
                        const matchesVariant = isEncounterInVariant(
                            encounter.games,
                            variant,
                        );
                        const isPickDisabled = disabled || !matchesVariant;

                        return (
                            <tr
                                key={`${encounter.name}-${encounter.subArea}-${encounter.terrain}`}
                                className={
                                    !matchesVariant
                                        ? variantMismatchRow
                                        : undefined
                                }
                            >
                                <td>{encounter.name}</td>
                                <td>{encounter.subArea}</td>
                                <td>{formatLevelRange(encounter)}</td>
                                <td>{formatWeight(encounter)}%</td>
                                <td>{formatTime(encounter)}</td>
                                <td>{encounter.terrain}</td>
                                <td>
                                    <Tooltip
                                        content={
                                            matchesVariant
                                                ? ''
                                                : `Only in ${variantDisplayName(encounter.games)}`
                                        }
                                        className={tooltipWrap}
                                    >
                                        <button
                                            type="button"
                                            className={pickButton}
                                            onClick={() => onPick(encounter)}
                                            disabled={isPickDisabled}
                                            aria-label={`Pick ${encounter.name}`}
                                            title={`Pick ${encounter.name}`}
                                        >
                                            🎣
                                        </button>
                                    </Tooltip>
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
`;

const variantMismatchRow = css`
    opacity: 0.6;
`;

const tooltipWrap = css`
    width: 100%;
`;
