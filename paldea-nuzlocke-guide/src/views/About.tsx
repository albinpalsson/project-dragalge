import { css } from '@project-dragalge/css-in-js';

interface AboutProps {
    onOpenLicenses: () => void;
}

export function About({ onOpenLicenses }: AboutProps) {
    return (
        <section>
            <h2>About</h2>
            <p className={body}>
                The Paldea nuzlocke guide is an offline-first tracker for Paldea
                Nuzlocke runs. It keeps your encounters, boss battles and caught
                Pokémon in your browser, with no account and no server.
            </p>
            <button
                className={textButton}
                type="button"
                onClick={onOpenLicenses}
            >
                Licenses &amp; Notices
            </button>
        </section>
    );
}

const body = css`
  color: var(--color-text-secondary);
`;

const textButton = css`
    padding: 0;
    border: 0;
    background: none;
    color: var(--color-info);
    font: inherit;
    text-decoration: underline;
    cursor: pointer;
`;
