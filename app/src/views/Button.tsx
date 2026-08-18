import { css, cx } from '@pokedb2/css-in-js';

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: background-color 0.15s, box-shadow 0.15s;
`;

const buttonPrimary = css`
  background: var(--color-primary);
  color: var(--color-on-primary);

  &:hover {
    background: var(--color-primary-hover);
  }
`;

interface ButtonProps {
    label: string;
    onClick?: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
    return (
        <button
            type="button"
            className={cx(buttonBase, buttonPrimary)}
            onClick={onClick}
        >
            {label}
        </button>
    );
}
