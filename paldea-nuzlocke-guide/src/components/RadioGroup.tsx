import { useId } from 'react';
import { css } from '@project-dragalge/css-in-js';

interface RadioOption<TValue extends string> {
    value: TValue;
    label: string;
}

interface RadioGroupProps<TValue extends string> {
    legend: string;
    value: TValue;
    options: readonly RadioOption<TValue>[];
    onChange: (value: TValue) => void;
}

export function RadioGroup<TValue extends string>({
    legend,
    value,
    options,
    onChange,
}: RadioGroupProps<TValue>) {
    const name = useId();
    return (
        <fieldset className={group}>
            <legend className={legendStyle}>{legend}</legend>
            {options.map((option) => (
                <label className={radio} key={option.value}>
                    <input
                        className={circle}
                        type="radio"
                        name={name}
                        value={option.value}
                        checked={option.value === value}
                        onChange={() => onChange(option.value)}
                    />
                    {option.label}
                </label>
            ))}
        </fieldset>
    );
}

const group = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    border: 0;
`;

const legendStyle = css`
    padding: 0;
    margin-bottom: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const radio = css`
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    width: fit-content;
    gap: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    cursor: pointer;
`;

const circle = css`
    appearance: none;
    display: grid;
    flex-shrink: 0;
    place-content: center;
    width: 1.6rem;
    height: 1.6rem;
    margin: 0;
    border: 0.1rem solid var(--color-border);
    border-radius: 50%;
    background: var(--color-surface-alt);
    cursor: inherit;
    transition: border-color 0.15s;

    &:hover {
        border-color: var(--color-text-muted);
    }

    &:checked {
        border-color: var(--color-primary);
    }

    &::after {
        content: '';
        width: 0.8rem;
        height: 0.8rem;
        border-radius: 50%;
        background: var(--color-primary);
        transform: scale(0);
        transition: transform 0.1s ease-in-out;
    }

    &:checked::after {
        transform: scale(1);
    }

    &:focus-visible {
        outline: 0.2rem solid var(--color-primary);
        outline-offset: 0.2rem;
    }
`;
