import { css } from '@pokedb2/css-in-js';

interface CheckboxProps {
    label: string;
    checked: boolean;
    disabled?: boolean;
    onChange: (checked: boolean) => void;
}

export function Checkbox({
    label,
    checked,
    disabled = false,
    onChange,
}: CheckboxProps) {
    return (
        <label className={checkbox}>
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
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;
