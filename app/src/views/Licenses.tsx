import { css } from '@pokedb2/css-in-js';

export function Licenses() {
    return (
        <article className={page}>
            <h2>Licenses &amp; Notices</h2>
            <p className={intro}>
                PokéDB is an unofficial fan project. Pokémon and related names,
                characters, and artwork belong to their respective rights
                holders. This page describes the sources and software included
                with this app; it does not grant rights to third-party material.
            </p>

            <section className={section} aria-labelledby="bulbapedia-title">
                <h3 id="bulbapedia-title">Bulbapedia data</h3>
                <p>
                    Some Pokémon reference data, location encounters, trainer
                    teams, and raid information are derived from Bulbapedia.
                    License terms can vary by page or revision. Where CC
                    BY-NC-SA 2.5 applies, attribution is required, commercial
                    use is not permitted, and adaptations must be shared under
                    the same license. See Bulbapedia&apos;s copyright information
                    and the source pages for applicable terms.
                </p>
                <p>
                    <a
                        href="https://bulbapedia.bulbagarden.net/wiki/Bulbapedia:About"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Bulbapedia About
                    </a>
                    {' · '}
                    <a
                        href="https://bulbapedia.bulbagarden.net/wiki/Bulbapedia:Copyrights"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Bulbapedia copyrights
                    </a>
                    {' · '}
                    <a
                        href="https://creativecommons.org/licenses/by-nc-sa/2.5/"
                        target="_blank"
                        rel="noreferrer"
                    >
                        CC BY-NC-SA 2.5 license
                    </a>
                </p>
                <p>
                    Examples of Bulbapedia source pages include{' '}
                    <a
                        href="https://bulbapedia.bulbagarden.net/wiki/Nemona"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Nemona
                    </a>
                    ,{' '}
                    <a
                        href="https://bulbapedia.bulbagarden.net/wiki/Katy"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Katy
                    </a>
                    ,{' '}
                    <a
                        href="https://bulbapedia.bulbagarden.net/wiki/Brassius"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Brassius
                    </a>
                    , and{' '}
                    <a
                        href="https://bulbapedia.bulbagarden.net/wiki/List_of_1%E2%98%85_Tera_Raid_Battles_(Paldea)"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Paldea Tera Raid Battles
                    </a>
                    .
                </p>
                <a href="/notices/bulbapedia-data.txt" download>
                    Full Bulbapedia data notice
                </a>
            </section>

            <section className={section} aria-labelledby="sprites-title">
                <h3 id="sprites-title">Pokémon sprites</h3>
                <p>
                    Icon sprites are sourced from Pokémon Database. Pokémon
                    Database describes its use of official Pokémon assets as
                    fair use; that position is not a license from the rights
                    holders. PokéDB is an unofficial, non-commercial fan
                    project. This describes the project&apos;s intended use; it
                    is not a license or permission from the rights holders.
                    Nintendo, Game Freak, and The Pokémon Company retain their
                    respective rights.
                </p>
                <p>
                    <a
                        href="https://pokemondb.net/sprites"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Pokémon Database sprite archive
                    </a>
                    {' · '}
                    <a
                        href="https://pokemondb.net/about"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Pokémon Database about and FAQ
                    </a>
                    {' · '}
                    <a
                        href="/assets/ATTRIBUTION.txt"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Sprite asset attribution
                    </a>
                </p>
                <a href="/notices/pokemondb-sprites.txt" download>
                    Full sprite notice
                </a>
            </section>

            <section className={section} aria-labelledby="software-title">
                <h3 id="software-title">Third-party software</h3>
                <p>
                    This app includes React, React DOM, and Scheduler, each
                    distributed under the MIT License.
                </p>
                <a href="/notices/third-party.txt" download>
                    Third-party software licenses
                </a>
            </section>

            <section className={section} aria-labelledby="privacy-title">
                <h3 id="privacy-title">Storage and privacy</h3>
                <p>
                    Game runs and preferences are stored in this browser on this
                    device. There is no account, automatic cloud backup, or
                    cross-device sync. Clearing this browser&apos;s site data
                    can remove saved runs. Exporting or sharing a run is an
                    action you choose.
                </p>
                <p>
                    The app asks for optional analytics consent after a run is
                    created. The event types include page views, game variant
                    and randomizer mode, and progression milestones; they do not
                    include game names or save contents. The remote GA4
                    transport is currently not implemented. In development,
                    consented events use a local debug sink instead.
                </p>
            </section>
        </article>
    );
}

const page = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  width: 100%;
  max-width: 90rem;
  margin: 0 auto;

  h2,
  h3,
  p {
    margin: 0;
  }

  h3 {
    font-size: var(--font-size-base);
  }

  a {
    color: var(--color-info);
    overflow-wrap: anywhere;
  }
`;

const intro = css`
  color: var(--color-text-secondary);
`;

const section = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding-top: var(--space-3);
  border-top: 0.1rem solid var(--color-border);

  p {
    color: var(--color-text-secondary);
  }
`;

