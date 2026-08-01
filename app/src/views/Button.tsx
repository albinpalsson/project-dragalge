import { css, cx } from "@pokedb2/css-in-js";

const buttonBase = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
`;

const buttonPrimary = css`
  background: var(--primary-color);
  color: var(--secondary-color);
`;

interface ButtonProps {
	label: string;
	onClick?: () => void;
}

export function Button({ label, onClick }: ButtonProps) {
	return (
    <button type="button" className={cx(buttonBase, buttonPrimary)} onClick={onClick}>
			{label}
		</button>
	);
}
