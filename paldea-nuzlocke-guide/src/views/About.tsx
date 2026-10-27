import { css } from '@project-dragalge/css-in-js';
import { textLink } from '../components/text-link';
import { FEEDBACK_EMAIL, GITHUB_ISSUES_URL, buildMailto } from '../contact';

interface AboutProps {
    onOpenLicenses: () => void;
    onOpenFriendship: () => void;
}

export function About({ onOpenLicenses, onOpenFriendship }: AboutProps) {
    return (
        <section className={about}>
            <div className={content}>
                <h2>About</h2>
                <div className={body}>
                    <p>
                        The Paldea Nuzlocke Guide is meant to guide Nuzlocke
                        players through Pokemon Scarlet and Violet. It provides
                        a suggested order for encounters and boss battles, along
                        with an encounter randomizer to help adapt the
                        first-encounter rule to these games.
                    </p>
                    <p>
                        New to Nuzlockes? Read{' '}
                        <a
                            className={textLink}
                            href="https://bulbapedia.bulbagarden.net/wiki/Nuzlocke_Challenge"
                            target="_blank"
                            rel="noreferrer"
                        >
                            what a Nuzlocke is
                        </a>
                        .
                    </p>

                    <p>
                        Scarlet and Violet have a few challenges compared with
                        more traditional, linear Pokemon games. This guide is,
                        most of all, a way of addressing two of them: keeping
                        encounters random and finding a route strategy that
                        makes for a satisfying run.
                    </p>

                    <h3>Keeping Encounters Random</h3>
                    <p>
                        One of the basic Nuzlocke rules is that the first
                        Pokemon you encounter in each area is the only one you
                        can try to catch. In Scarlet and Violet, wild Pokemon
                        are visible before you battle them. That makes it much
                        easier to choose what you encounter, even without
                        meaning to, and takes away some of the randomness.
                    </p>
                    <p>
                        The app includes an encounter randomizer with several
                        modes, so you can roll your encounter and then go
                        looking for it in the game. It also gives hints about
                        where and when the encounter can be found. There are
                        manual adjustments too, such as excluding ocean
                        encounters by default in early areas where you would not
                        yet be able to swim. You can change these filters
                        manually.
                    </p>

                    <h3>Routing An Open World</h3>
                    <p>
                        Scarlet and Violet let you roam through a large part of
                        Paldea whenever you want, but encounter and boss levels
                        do not scale with your progress. For a traditional
                        Nuzlocke experience, this app suggests a strict but fair
                        order for both encounters and boss battles.
                    </p>
                    <p>
                        The aim is to make it clear where to go next without
                        having to stop and research the order as you play. The
                        suggested route strategy brings you to encounters at
                        levels that fit your team and the game's progression,
                        rather than having you collect too many encounters too
                        early.
                    </p>
                    <p>
                        By following the guide's progression order, you need
                        very little grinding. Your box fills up gradually, and
                        the run still offers a fair amount of challenge. There
                        are many ways to route a Nuzlocke, but this guide
                        presents one that I find enjoyable and balanced.
                    </p>

                    <h3>Author's Note</h3>
                    <p>
                        I developed this app because I love playing Nuzlockes on
                        my Switch. Paldea is my favourite region to Nuzlocke for
                        two main reasons. First, it has a vast number of
                        available Pokemon species. That variety keeps pushing me
                        to use different Pokemon from run to run and learn how
                        to make the most of them. Second, Scarlet and Violet
                        have the most quality-of-life features of any Pokemon
                        games, which makes them especially enjoyable to play on
                        Switch.
                    </p>
                    <p>
                        Besides helping with encounter randomization and
                        routing, I wanted the app to let me play through the
                        game using only my Switch, without having to research or
                        look things up too much. Ideally, I can keep a single
                        browser tab open on my phone. That is why it includes
                        additional details, such as Pokemon base stats,
                        evolutions, defensive weaknesses, helpful tips
                        throughout the game, information about strong
                        trainers, friendship mechanics and in-game trades.
                    </p>

                    <h4>My Recommended Rules</h4>
                    <p>
                        For an extra challenge, these are the rules I recommend
                        alongside following the guide's route and encounter
                        order:
                    </p>
                    <ul>
                        <li>
                            Do not farm Tera shards or change the Tera types of
                            your Pokemon.
                        </li>
                        <li>
                            Do not enter an area before you reach it in the
                            suggested guide order. For example, do not visit
                            West Province (Area One) to pick up a Thunder Stone
                            before you have defeated Brassius and it is time to
                            randomize your encounter for that location.
                        </li>
                                                <li>
                            Avoid{' '} 
                            <button
                                className={textLink}
                                type="button"
                                onClick={onOpenFriendship}
                            >
                                friendship
                            </button>{' '}
                            battle bonuses.
                        </li>
                        <li>
                            Enter the Elite Four with no Pokemon above level 61.
                        </li>
                        <li>
                            Keep the same party for the Elite Four, Geeta, and
                            the final Nemona battle. Continue straight through
                            to Nemona after defeating Geeta, treating the gap
                            between them just like the gaps between Elite Four
                            members. Healing your team is allowed between
                            battles, but no party changes, extra training,
                            candies, or other preparation.
                        </li>
                    </ul>
                    <p>
                        These are my recommendations, not rules the app can
                        enforce in your game.
                    </p>

                    <h3>Maintenance And Feedback</h3>
                    <p>
                        I actively maintain this app. If you find a mistake,
                        want to suggest an improvement, or just want to send
                        feedback, please send an email.
                    </p>
                    <p>
                        Email:{' '}
                        <a
                            className={textLink}
                            href={buildMailto('Paldea Nuzlocke Guide feedback')}
                        >
                            {FEEDBACK_EMAIL}
                        </a>
                        . You can also{' '}
                        <a
                            className={textLink}
                            href={GITHUB_ISSUES_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            open an issue on GitHub
                        </a>
                        .
                    </p>
                </div>
                <button
                    className={textLink}
                    type="button"
                    onClick={onOpenLicenses}
                >
                    Licenses &amp; Notices
                </button>
            </div>
        </section>
    );
}

const body = css`
  color: var(--color-text-secondary);

    h3,
    h4 {
        color: var(--color-text);
    }

    h3 {
        margin: var(--space-5) 0 var(--space-2);
        font-size: 1.6rem;
        font-weight: var(--font-weight-bold);
    }

    h4 {
        margin: var(--space-4) 0 var(--space-2);
        font-size: var(--font-size-sm);
        font-weight: var(--font-weight-normal);
    }

    p,
    ul {
        margin: 0 0 var(--space-3);
    }

    ul {
        padding-left: var(--space-4);
    }

    li + li {
        margin-top: var(--space-2);
    }

`;

const about = css`
    h2 {
        margin: 0 0 var(--space-4);
    }
`;

const content = css`
    width: 100%;
`;
