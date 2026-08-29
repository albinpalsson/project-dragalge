import { css, cx } from '@pokedb2/css-in-js';

export interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    className?: string;
}

export function Select({
    label,
    value,
    onChange,
    options,
    className,
}: SelectProps) {
    return (
        <label className={cx(field, className)}>
            {label}
            <select
                className={input}
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </label>
    );
}

const field = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const input = css`
  padding: var(--space-2);
  font-size: var(--font-size-base);
  color: var(--color-text);
  background: var(--color-bg);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
`;
