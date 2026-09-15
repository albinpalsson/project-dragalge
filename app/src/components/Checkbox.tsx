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
        <label className={cx(checkbox, clickableStyle)} title={title}>
            <input
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
    gap: var(--space-1);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const clickableStyle = css`
  cursor: pointer;
`;
