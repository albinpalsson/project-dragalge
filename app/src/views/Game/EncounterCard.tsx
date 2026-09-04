import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import type { CaughtPokemonRow } from '../../db/game-db/schema';
import { pokemonIconSrc } from '../../pokemon-icon';
import {
    type LocationEncounterView,
    useCatchPokemonMutation,
    useLocationEncountersQuery,
} from './queries';

interface EncounterCardProps {
    gameRunId: string;
    locationId: string;
    caught: CaughtPokemonRow[];
}

export function EncounterCard({
    gameRunId,
    locationId,
    caught,
}: EncounterCardProps) {
    const [isExpanded, setExpanded] = useState(false);
    const [includeOcean, setIncludeOcean] = useState(false);
    const encountersQuery = useLocationEncountersQuery(locationId);
    const catchPokemonMutation = useCatchPokemonMutation();
    const caughtRow = caught.find((row) => row.location_id === locationId);
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
    const caughtEncounter = details?.encounters.find(
        (encounter) => encounter.pokemonId === caughtRow?.pokemon_id,
    );

    const catchEncounter = (encounter: LocationEncounterView) => {
        catchPokemonMutation.mutate({
            gameRunId,
            pokemonId: encounter.pokemonId,
            locationId,
        });
    };

    return (
        <article className={card} aria-labelledby={`${locationId}-heading`}>
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

                    {caughtEncounter ? (
                        <div className={caughtBox}>
                            <img
                                className={caughtIcon}
                                src={pokemonIconSrc(toSlug(caughtEncounter.name))}
                                alt={caughtEncounter.name}
                                loading="lazy"
                            />
                            <span>Caught {caughtEncounter.name}</span>
                        </div>
                    ) : (
                        <p className={mutedText}>
                            Pick a listed Pokemon to mark this encounter as caught.
                        </p>
                    )}

                    <Button
                        variant="secondary"
                        onClick={() => setExpanded((value) => !value)}
                    >
                        {isExpanded ? 'Hide encounters' : 'Show encounters'}
                    </Button>

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
                                                        catchEncounter(encounter)
                                                    }
                                                    disabled={
                                                        catchPokemonMutation.isPending ||
                                                        caughtRow !== undefined
                                                    }
                                                >
                                                    Catch {encounter.name}
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
    const weight =
        (encounter.morningRate +
            encounter.dayRate +
            encounter.eveningRate +
            encounter.nightRate) /
        4;
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

const caughtBox = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const caughtIcon = css`
  width: 5.6rem;
  height: 5.6rem;
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