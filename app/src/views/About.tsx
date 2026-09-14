import { css } from '@pokedb2/css-in-js';

export function About() {
    return (
        <section>
            <h2>About</h2>
            <p className={body}>
                This is an offline-first tracker for Paldea Nuzlocke runs. It
                keeps your encounters, boss battles and caught Pokémon in your
                browser, with no account and no server.
            </p>
        </section>
    );
}

const body = css`
  color: var(--color-text-secondary);
`;
