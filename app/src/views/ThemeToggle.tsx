import { useState } from 'react';
import { IconButton } from '../components/IconButton';
import { getCurrentTheme, setTheme } from '../theme';

export function ThemeToggle() {
    const [theme, setThemeState] = useState(getCurrentTheme);

    const toggle = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        setThemeState(next);
    };

    return (
        <IconButton
            label={
                theme === 'dark'
                    ? 'Switch to light theme'
                    : 'Switch to dark theme'
            }
            onClick={toggle}
        >
            {theme === 'dark' ? '\u2600\ufe0f' : '\ud83c\udf19'}
        </IconButton>
    );
}
