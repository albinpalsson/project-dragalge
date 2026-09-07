import { css } from '@pokedb2/css-in-js';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import {
    formatGames,
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
                        <th>Games</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {encounters.map((encounter) => (
                        <tr
                            key={`${encounter.name}-${encounter.subArea}-${encounter.terrain}`}
                        >
                            <td>{encounter.name}</td>
                            <td>{encounter.subArea}</td>
                            <td>{formatLevelRange(encounter)}</td>
                            <td>{formatWeight(encounter)}%</td>
                            <td>{formatTime(encounter)}</td>
                            <td>{encounter.terrain}</td>
                            <td>{formatGames(encounter.games)}</td>
                            <td>
                                <button
                                    type="button"
                                    className={pickButton}
                                    onClick={() => onPick(encounter)}
                                    disabled={disabled}
                                >
                                    Pick {encounter.name}
                                </button>
                            </td>
                        </tr>
                    ))}
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
`;

const pickButton = css`
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
`;
