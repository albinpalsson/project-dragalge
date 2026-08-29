import { css, cx } from '@pokedb2/css-in-js';

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'number';
    className?: string;
}

export function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    className,
}: TextFieldProps) {
    return (
        <label className={cx(field, className)}>
            {label}
            <input
                className={input}
                type={type}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
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
