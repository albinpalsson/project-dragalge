import { css } from '@project-dragalge/css-in-js';

export const textLink = css`
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-link);
    font: inherit;
    font-weight: var(--font-weight-bold);
    text-decoration: underline;
    text-decoration-thickness: 0.1em;
    text-underline-offset: 0.16em;
    text-decoration-skip-ink: auto;
    cursor: pointer;

    &:visited {
        color: var(--color-link);
    }

    &:hover,
    &:active {
        color: var(--color-link-hover);
        text-decoration-thickness: 0.14em;
    }

    &:focus-visible {
        outline: 0.2rem solid var(--color-accent);
        outline-offset: 0.1rem;
    }
`;