import { useEffect, useRef, useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from './Button';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { randomizeEncounter, type RandomizerMode } from '../randomizer';

export const ROLL_DELAY_MS = 700;

interface EncounterRandomizerProps {
    encounters: LocationEncounterView[];
    randomizerMode: RandomizerMode;
    disabled: boolean;
    onPick: (encounter: LocationEncounterView) => void;
}

export function EncounterRandomizer({
    encounters,
    randomizerMode,
    disabled,
    onPick,
}: EncounterRandomizerProps) {
    const [pendingGroup, setPendingGroup] = useState<
        LocationEncounterView[] | null
    >(null);
    const [isRolling, setRolling] = useState(false);
    const rollTimerRef = useRef<number | undefined>(undefined);

    useEffect(() => {
        return () => {
            if (rollTimerRef.current !== undefined) {
                window.clearTimeout(rollTimerRef.current);
            }
        };
    }, []);

    const randomize = () => {
        if (isRolling) {
            return;
        }
        setRolling(true);
        rollTimerRef.current = window.setTimeout(() => {
            setRolling(false);
            const group = randomizeEncounter(encounters, randomizerMode);
            if (!group) {
                return;
            }
            if (group.members.length === 1) {
                onPick(group.members[0]);
            } else {
                setPendingGroup(group.members);
            }
        }, ROLL_DELAY_MS);
    };

    const pickEncounter = (encounter: LocationEncounterView) => {
        setPendingGroup(null);
        onPick(encounter);
    };

    return (
        <>
            <Button
                variant="warm"
                onClick={randomize}
                disabled={disabled || isRolling}
            >
                <span className={isRolling ? spinningDie : undefined}>🎲</span>{' '}
                Randomize
            </Button>
            {pendingGroup && (
                <div className={pendingGroupBox}>
                    <p>Rolled a group with multiple forms - pick one:</p>
                    <ul className={options}>
                        {pendingGroup.map((encounter) => (
                            <li key={`${encounter.name}-${encounter.subArea}`}>
                                <button
                                    type="button"
                                    className={pickButton}
                                    onClick={() => pickEncounter(encounter)}
                                    disabled={disabled}
                                >
                                    {encounter.name} ({encounter.subArea})
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}

const pendingGroupBox = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  p {
    margin: 0;
    color: var(--color-text-muted);
  }
`;

const options = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const pickButton = css`
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  background: transparent;
`;

const spinningDie = css`
    display: inline-block;
    animation-name: pokedb-spin;
    animation-duration: 0.8s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
`;
