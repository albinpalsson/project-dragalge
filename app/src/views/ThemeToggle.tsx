import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { getCurrentTheme, setTheme } from '../theme';

export function ThemeToggle() {
    const [theme, setThemeState] = useState(getCurrentTheme);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setThemeState(next);
    };

    return (
        <button
            type="button"
            className={toggleButton}
            onClick={toggle}
            aria-label={
                theme === 'dark'
                    ? 'Switch to light theme'
                    : 'Switch to dark theme'
            }
        >
            {theme === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19'}
        </button>
    );
}

const toggleButton = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 4rem;
  height: 4rem;
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  font-size: var(--font-size-lg);
  cursor: pointer;
`;
