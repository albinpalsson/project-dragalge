import { css, cx } from '@pokedb2/css-in-js';

interface TextFieldProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: 'text' | 'password' | 'number';
    maxLength?: number;
    error?: string;
    help?: string;
    disabled?: boolean;
    className?: string;
}

export function TextField({
    label,
    value,
    onChange,
    placeholder,
    type = 'text',
    maxLength,
    error,
    help,
    disabled,
    className,
}: TextFieldProps) {
    const message = error ?? help;
    const messageId = message ? `${label}-message` : undefined;

    return (
        <label className={cx(field, className)}>
            {label}
            <input
                className={input}
                type={type}
                value={value}
                placeholder={placeholder}
                maxLength={maxLength}
                disabled={disabled}
                aria-invalid={error ? true : undefined}
                aria-describedby={messageId}
                onChange={(e) => onChange(e.target.value)}
            />
            {message && (
                <span id={messageId} className={error ? errorText : helpText}>
                    {message}
                </span>
            )}
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

const helpText = css`
    color: var(--color-text-muted);
`;

const errorText = css`
    color: var(--color-danger);
`;
