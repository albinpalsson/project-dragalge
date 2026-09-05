import { useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import type {
    EncounterRollRow,
    EncounterStatus,
} from '../../db/game-db/schema';
import { pokemonIconSrc } from '../../pokemon-icon';
import {
    getEffectiveWeight,
    randomizeEncounter,
    type RandomizerMode,
} from '../../randomizer';
import {
    type LocationEncounterView,
    useAddEncounterRollMutation,
    useClearEncounterRollMutation,
    useLocationEncountersQuery,
    useSetEncounterRollStatusMutation,
} from './queries';

interface EncounterCardProps {
    gameRunId: string;
    locationId: string;
    rolls: EncounterRollRow[];
    randomizerMode: RandomizerMode;
}

const STATUS_LABELS: Record<EncounterStatus, string> = {
    pending: 'Rolled',
    caught: 'Caught',
    missed: 'Missed',
    eliminated: 'Eliminated',
};

const RESOLVED_STATUSES: readonly EncounterStatus[] = [
    'caught',
    'missed',
    'eliminated',
];

export function EncounterCard({
    gameRunId,
    locationId,
    rolls,
    randomizerMode,
}: EncounterCardProps) {
    const [isExpanded, setExpanded] = useState(false);
    const [includeOcean, setIncludeOcean] = useState(false);
    const encountersQuery = useLocationEncountersQuery(locationId);
    const addRollMutation = useAddEncounterRollMutation();
    const setStatusMutation = useSetEncounterRollStatusMutation();
    const clearRollMutation = useClearEncounterRollMutation();

    const roll = rolls.find((row) => row.location_id === locationId);
    const [pendingGroup, setPendingGroup] = useState<
        LocationEncounterView[] | null
    >(null);
    const details = encountersQuery.data;
    const landEncounters = (details?.encounters ?? []).filter(
        (encounter) => encounter.subArea !== 'Ocean',
    );
    const oceanEncounters = (details?.encounters ?? []).filter(
        (encounter) => encounter.subArea === 'Ocean',
    );
    const activeEncounters = includeOcean
        ? [...landEncounters, ...oceanEncounters]
        : landEncounters;
    const levelRange = getLevelRange(activeEncounters);
    const rolledEncounter = details?.encounters.find(
        (encounter) => encounter.pokemonId === roll?.pokemon_id,
    );

    const isBusy =
        addRollMutation.isPending ||
        setStatusMutation.isPending ||
        clearRollMutation.isPending;

    const pickEncounter = (encounter: LocationEncounterView) => {
        setPendingGroup(null);
        addRollMutation.mutate({
            gameRunId,
            locationId,
            pokemonId: encounter.pokemonId,
        });
    };

    const randomize = () => {
        const group = randomizeEncounter(activeEncounters, randomizerMode);
        if (!group) {
            return;
        }
        if (group.members.length === 1) {
            pickEncounter(group.members[0]);
        } else {
            setPendingGroup(group.members);
        }
    };

    return (
        <article
            className={cx(card, roll && statusStyle(roll.status))}
            aria-labelledby={`${locationId}-heading`}
        >
            <div className={header}>
                <div>
                    <h3 id={`${locationId}-heading`} className={heading}>
                        {details?.location.name ?? locationId}
                    </h3>
                    {details && (
                        <p className={subheading}>{details.location.region}</p>
                    )}
                </div>
                {details && (
                    <div className={badges}>
                        <span className={badge}>{details.location.province}</span>
                        {levelRange && (
                            <span className={badge}>
                                Lv {levelRange.min}-{levelRange.max}
                            </span>
                        )}
                        <span className={badge}>
                            {activeEncounters.length} encounters
                        </span>
                    </div>
                )}
            </div>

            {encountersQuery.isPending && (
                <p className={mutedText}>Loading encounters...</p>
            )}
            {encountersQuery.isError && (
                <p className={mutedText}>Error loading encounters.</p>
            )}
            {details && (
                <>
                    {oceanEncounters.length > 0 && (
                        <label className={oceanToggle}>
                            <input
                                type="checkbox"
                                checked={includeOcean}
                                onChange={(event) =>
                                    setIncludeOcean(event.target.checked)
                                }
                            />
                            Include ocean encounters
                        </label>
                    )}

                    {roll && rolledEncounter ? (
                        <div className={rollBox}>
                            <img
                                className={rollIcon}
                                src={pokemonIconSrc(toSlug(rolledEncounter.name))}
                                alt={rolledEncounter.name}
                                loading="lazy"
                            />
                            <div>
                                <p className={rollTitle}>
                                    {STATUS_LABELS[roll.status]}{' '}
                                    {rolledEncounter.name}
                                </p>
                                <p className={rollMeta}>
                                    Lv {formatLevelRange(rolledEncounter)} ·{' '}
                                    {rolledEncounter.subArea} ·{' '}
                                    {formatWeight(rolledEncounter)}% ·{' '}
                                    {formatTime(rolledEncounter)}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className={mutedText}>
                            Randomize or pick an encounter from the list.
                        </p>
                    )}

                    {pendingGroup && (
                        <div className={pendingGroupBox}>
                            <p className={mutedText}>
                                Rolled a group with multiple forms — pick one:
                            </p>
                            <ul className={options}>
                                {pendingGroup.map((encounter) => (
                                    <li key={encounter.pokemonId}>
                                        <button
                                            type="button"
                                            className={pickButton}
                                            onClick={() =>
                                                pickEncounter(encounter)
                                            }
                                            disabled={isBusy}
                                        >
                                            {encounter.name} ({encounter.subArea})
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className={actions}>
                        <Button
                            onClick={randomize}
                            disabled={
                                isBusy ||
                                roll !== undefined ||
                                pendingGroup !== null ||
                                activeEncounters.length === 0
                            }
                        >
                            Randomize
                        </Button>

                        {roll &&
                            RESOLVED_STATUSES.map((status) => (
                                <Button
                                    key={status}
                                    variant="secondary"
                                    onClick={() =>
                                        setStatusMutation.mutate({
                                            gameRunId,
                                            locationId,
                                            status,
                                        })
                                    }
                                    disabled={isBusy || roll.status === status}
                                >
                                    {STATUS_LABELS[status]}
                                </Button>
                            ))}

                        {roll && (
                            <Button
                                variant="secondary"
                                onClick={() =>
                                    clearRollMutation.mutate({
                                        gameRunId,
                                        locationId,
                                    })
                                }
                                disabled={isBusy}
                            >
                                Clear
                            </Button>
                        )}

                        <Button
                            variant="secondary"
                            onClick={() => setExpanded((value) => !value)}
                        >
                            {isExpanded ? 'Hide encounters' : 'Show encounters'}
                        </Button>
                    </div>

                    {isExpanded && (
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
                                    {activeEncounters.map((encounter) => (
                                        <tr
                                            key={`${encounter.pokemonId}-${encounter.subArea}-${encounter.terrain}`}
                                        >
                                            <td>{encounter.name}</td>
                                            <td>{encounter.subArea}</td>
                                            <td>
                                                {formatLevelRange(encounter)}
                                            </td>
                                            <td>{formatWeight(encounter)}%</td>
                                            <td>{formatTime(encounter)}</td>
                                            <td>{encounter.terrain}</td>
                                            <td>{formatGames(encounter.games)}</td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className={pickButton}
                                                    onClick={() =>
                                                        pickEncounter(encounter)
                                                    }
                                                    disabled={
                                                        isBusy ||
                                                        roll !== undefined ||
                                                        pendingGroup !== null
                                                    }
                                                >
                                                    Pick {encounter.name}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </>
            )}
        </article>
    );
}

function getLevelRange(encounters: LocationEncounterView[]) {
    if (encounters.length === 0) {
        return undefined;
    }
    return {
        min: Math.min(...encounters.map((encounter) => encounter.minLevel)),
        max: Math.max(...encounters.map((encounter) => encounter.maxLevel)),
    };
}

function formatLevelRange(encounter: LocationEncounterView): string {
    if (encounter.minLevel === encounter.maxLevel) {
        return String(encounter.minLevel);
    }
    return `${encounter.minLevel}-${encounter.maxLevel}`;
}

function formatWeight(encounter: LocationEncounterView): string {
    const weight = getEffectiveWeight(encounter);
    return Number.isInteger(weight) ? String(weight) : weight.toFixed(1);
}

function formatTime(encounter: LocationEncounterView): string {
    const times = [
        ['morning', encounter.morningRate],
        ['day', encounter.dayRate],
        ['evening', encounter.eveningRate],
        ['night', encounter.nightRate],
    ]
        .filter(([, rate]) => Number(rate) > 0)
        .map(([time]) => time);
    return times.length === 4 ? 'All' : times.join('/');
}

function formatGames(games: string): string {
    return games
        .toUpperCase()
        .split('')
        .join('/');
}

function statusStyle(status: EncounterStatus): string | undefined {
    return status === 'missed' || status === 'eliminated'
        ? resolvedCard
        : undefined;
}

// Icon/display resolution is naive until a dedicated utility exists.
function toSlug(name: string): string {
    return name.toLowerCase();
}

const card = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const header = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-lg);
`;

const subheading = css`
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const badges = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1);
`;

const badge = css`
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const mutedText = css`
  margin: 0;
  color: var(--color-text-muted);
`;

const oceanToggle = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const resolvedCard = css`
  && {
    opacity: 0.6;
  }
`;

const actions = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
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

const pendingGroupBox = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const options = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
`;

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
  color: var(--color-text);
  cursor: pointer;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;