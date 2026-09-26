import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';

interface PokemonAutocompleteProps {
    suggestions: readonly string[];
    onAdd: (name: string) => void;
    placeholder?: string;
}

export function PokemonAutocomplete({
    suggestions,
    onAdd,
    placeholder = 'Search Pokémon',
}: PokemonAutocompleteProps) {
    const [query, setQuery] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(0);
    const normalizedQuery = query.trim().toLowerCase();
    const matches = normalizedQuery
        ? suggestions
              .filter((name) => name.toLowerCase().includes(normalizedQuery))
              .slice(0, 8)
        : [];

    const add = (name: string | undefined) => {
        if (!name) {
            return;
        }
        onAdd(name);
        setQuery('');
    };

    return (
        <div className={container}>
            <label className={label}>
                Add a Pokémon ban
                <input
                    className={input}
                    value={query}
                    placeholder={placeholder}
                    role="combobox"
                    aria-expanded={matches.length > 0}
                    aria-autocomplete="list"
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'ArrowDown') {
                            event.preventDefault();
                            setHighlightedIndex((index) =>
                                Math.min(index + 1, matches.length - 1),
                            );
                        } else if (event.key === 'ArrowUp') {
                            event.preventDefault();
                            setHighlightedIndex((index) => Math.max(index - 1, 0));
                        } else if (event.key === 'Enter') {
                            event.preventDefault();
                            add(matches[highlightedIndex]);
                        } else if (event.key === 'Escape') {
                            setQuery('');
                        }
                    }}
                />
            </label>
            {matches.length > 0 && (
                <ul className={suggestionsList}>
                    {matches.map((name, index) => (
                        <li key={name}>
                            <button
                                type="button"
                                className={index === highlightedIndex ? activeSuggestion : suggestion}
                                role="option"
                                aria-selected={index === highlightedIndex}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => add(name)}
                            >
                                {name}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

const container = css`
    position: relative;
`;

const label = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const input = css`
    padding: var(--space-2);
    color: var(--color-text);
    background: var(--color-bg);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    font-size: var(--font-size-base);
`;

const suggestionsList = css`
    position: absolute;
    z-index: 1200;
    top: 100%;
    right: 0;
    left: 0;
    margin: var(--space-1) 0 0;
    padding: 0;
    overflow: hidden;
    list-style: none;
    background: var(--color-surface);
    border: 0.1rem solid var(--color-border);
    box-shadow: var(--shadow-md);
`;

const suggestion = css`
    display: block;
    width: 100%;
    padding: var(--space-2);
    color: var(--color-text);
    text-align: left;
    background: transparent;
    border: 0;
    cursor: pointer;
`;

const activeSuggestion = css`
    display: block;
    width: 100%;
    padding: var(--space-2);
    color: var(--color-text);
    text-align: left;
    border: 0;
    cursor: pointer;
    background: var(--color-hover-overlay);
`;
