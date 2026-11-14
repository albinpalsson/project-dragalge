import { css, cx } from '@project-dragalge/css-in-js';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import type { EncounterRoll } from '../hooks/useEncounterRoll';
import { getEncounterGroupKey } from '../pokemon-species';
import { useGame } from '../views/Game/GameContext';
import {
    formatLevelRange,
    formatTime,
    formatWeight,
} from '../utils/encounter-formatters';
import { Button } from './Button';

interface EncounterTableProps {
    encounters: LocationEncounterView[];
    encounterRoll: EncounterRoll | undefined;
    disabled: boolean;
    onPick: (pokemonName: string) => void;
}

export function EncounterTable({
    encounters,
    encounterRoll,
    disabled,
    onPick,
}: EncounterTableProps) {
    const { getBanReason } = useGame();
    const pickedGroup =
        encounterRoll &&
        encounterRoll.status !== 'notRolled' &&
        encounterRoll.status !== 'skipped'
            ? encounterRoll.displayName
            : undefined;

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
                        const banReason = getBanReason(encounter.name);
                        const isPickDisabled = disabled || !!banReason;
                        const isPicked =
                            pickedGroup !== undefined &&
                            getEncounterGroupKey(encounter.name) ===
                                pickedGroup;

                        return (
                            <tr
                                key={`${encounter.name}-${encounter.subArea}-${encounter.terrain}`}
                                className={cx(
                                    banReason && excludedRow,
                                    isPicked && pickedRow,
                                )}
                                aria-current={isPicked ? 'true' : undefined}
                                data-picked={isPicked ? 'true' : undefined}
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
                                    <Button
                                        variant="secondary"
                                        className={pickButton}
                                        onClick={() => onPick(encounter.name)}
                                        disabled={isPickDisabled}
                                        ariaLabel={`Pick ${encounter.name}`}
                                        title={`Pick ${encounter.name}`}
                                    >
                                        <span aria-hidden="true">🎣</span>
                                    </Button>
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
    && {
        padding: var(--space-1) var(--space-2);
        font-size: var(--font-size-sm);
    }

    span {
        filter: grayscale(1);
    }

    &:hover:not(:disabled) span,
    &:focus-visible span {
        filter: none;
    }
`;

const pickedRow = css`
    &&& {
        background: var(--color-picked-row);
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
