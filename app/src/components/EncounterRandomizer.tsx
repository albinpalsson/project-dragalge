import { useEffect, useRef, useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { Button } from './Button';
import type { LocationEncounterView } from '../db/pokemon-data/queries';
import { randomizeEncounter, type RandomizerMode } from '../randomizer';

export const ROLL_DELAY_MS = 700;

interface EncounterRandomizerProps {
    encounters: LocationEncounterView[];
    randomizerMode: RandomizerMode;
    hasExistingRoll: boolean;
    disabled: boolean;
    onPick: (encounter: LocationEncounterView) => void;
}

export function EncounterRandomizer({
    encounters,
    randomizerMode,
    hasExistingRoll,
    disabled,
    onPick,
}: EncounterRandomizerProps) {
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
            const encounter = randomizeEncounter(encounters, randomizerMode);
            if (!encounter) {
                return;
            }
            onPick(encounter);
        }, ROLL_DELAY_MS);
    };

    return (
        <Button
            variant={hasExistingRoll ? 'secondary' : 'warm'}
            onClick={randomize}
            disabled={disabled || isRolling}
            ariaLabel={hasExistingRoll ? 'Re-roll' : 'Randomize'}
            title={hasExistingRoll ? 'Re-roll' : 'Randomize'}
        >
            <span className={cx(padding, isRolling ? spinningDie : undefined)}>
                🎲
            </span>{' '}
            {hasExistingRoll ? 'Re-roll' : 'Randomize'}
        </Button>
    );
}

const spinningDie = css`
    display: inline-block;
    animation-name: pokedb-spin;
    animation-duration: 0.8s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
`;

const padding = css`
    padding-right: 0.5rem;
    padding-left: 0.5rem;
`;
