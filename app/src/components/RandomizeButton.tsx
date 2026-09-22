import { useEffect, useRef, useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { Button } from './Button';

export const ROLL_DELAY_MS = 700;
const reducedMotionQuery = '(prefers-reduced-motion: reduce)';

interface RandomizeButtonProps {
    label: string;
    disabled: boolean;
    variant?: 'warm' | 'secondary';
    ariaLabel: string;
    title: string;
    onRandomize: () => void | Promise<void>;
}

export function RandomizeButton({
    label,
    disabled,
    variant = 'warm',
    ariaLabel,
    title,
    onRandomize,
}: RandomizeButtonProps) {
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
            void onRandomize();
        }, window.matchMedia(reducedMotionQuery).matches ? 0 : ROLL_DELAY_MS);
    };

    return (
        <Button
            variant={variant}
            onClick={randomize}
            disabled={disabled || isRolling}
            ariaLabel={ariaLabel}
            title={title}
        >
            <span className={cx(dicePadding, isRolling ? spinningDie : undefined)}>
                🎲
            </span>{' '}
            {label}
        </Button>
    );
}

const spinningDie = css`
    display: inline-block;
    animation-name: pokedb-spin;
    animation-duration: 0.8s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;

    @media (prefers-reduced-motion: reduce) {
        animation: none;
    }
`;

const dicePadding = css`
    padding-right: 0.5rem;
    padding-left: 0.5rem;
`;