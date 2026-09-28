import { css, cx } from '@pokedb2/css-in-js';

interface CheckboxProps {
    label: string;
    checked: boolean;
    disabled?: boolean;
    title?: string;
    onChange: (checked: boolean) => void;
}

export function Checkbox({
    label,
    checked,
    disabled = false,
    title,
    onChange,
}: CheckboxProps) {
    return (
        <label
            className={cx(checkbox, !disabled && clickableStyle, disabled && disabledStyle)}
            title={title}
        >
            <input
                className={box}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
            />
            {label}
        </label>
    );
}

const checkbox = css`
    display: inline-flex;
    align-items: center;
    align-self: flex-start;
    width: fit-content;
    gap: var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const clickableStyle = css`
  cursor: pointer;
`;

const disabledStyle = css`
    cursor: not-allowed;
`;

const box = css`
    appearance: none;
    display: grid;
    flex-shrink: 0;
    place-content: center;
    width: 1.6rem;
    height: 1.6rem;
    margin: 0;
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    cursor: inherit;
    transition: background-color 0.15s, border-color 0.15s;

    &:hover {
        border-color: var(--color-text-muted);
    }

    &:checked {
        border-color: var(--color-primary);
        background: var(--color-primary);
    }

    &:checked:hover {
        border-color: var(--color-primary-hover);
        background: var(--color-primary-hover);
    }

    &::after {
        content: '';
        width: 0.45rem;
        height: 0.8rem;
        border: solid var(--color-on-primary);
        border-width: 0 0.2rem 0.2rem 0;
        transform: rotate(45deg) scale(0);
        transition: transform 0.1s ease-in-out;
    }

    &:checked::after {
        transform: rotate(45deg) scale(1);
    }

    &:focus-visible {
        outline: 0.2rem solid var(--color-primary);
        outline-offset: 0.2rem;
    }

    &:disabled {
        opacity: 0.5;
    }
`;
