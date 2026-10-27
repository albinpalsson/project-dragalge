import { css } from '@project-dragalge/css-in-js';
export function FriendshipGuide() {
    return (
        <div className={guide}>
            <p>
                Some Pokemon only evolve with high friendship, and friendship
                also gives hidden battle bonuses that can make a Nuzlocke
                easier. This guide explains how to raise it, lower it, and
                check where a Pokemon stands.
            </p>

            <h3>How friendship works</h3>
            <p>
                Friendship is a value from 0 to 255. Normal play only raises it
                up to 160; past that, only picnic activity raises it.
                Friendship evolutions need high friendship, which is 160.
            </p>
            <p>
                From 180 friendship, Pokemon get battle bonuses: a chance to
                survive a knockout, a chance to recover from status conditions
                by themselves, a 10% evasion chance, and double critical hit
                chance (at 255).
            </p>

            <p>
                <strong>Tip: raise friendship for an evolution.</strong> By
                making 8 sandwiches in a picnic, a Pokemon with 0 friendship
                will reach 160, the minimum friendship needed for friendship
                evolutions. Each sandwich gives +20 friendship.
            </p>
            <p>
                <strong>Tip: avoid friendship battle bonuses.</strong> If you
                want to be sure your Pokemon gets no friendship battle bonuses,
                feed it 8 bitter medicines, such as Energy Root and Energy Powder.
                This lowers its friendship to 175 or less, below the 180 bonus
                threshold, regardless of the starting point. Each medicine
                lowers friendship by 10 above 160, and feeding them during
                battles against low-level encounters is an easy way to use
                them. Energy powder is sold at Chansey Supply
                shops across Paldea.
            </p>

            <h3>Checking a Pokemon's friendship</h3>
            <p>
                A woman with a Marill stands by the fountain in the middle of
                Cascarrafa. Talk to her and pick a Pokemon from your party or
                box to hear how it feels about you.
            </p>
            <ul>
                <li>
                    "You're getting along well…" means friendship is between
                    130 and 179. No battle bonuses yet.
                </li>
                <li>
                    "You're good friends, all right!", "Wow, you're pretty great
                    friends!" or "Whoa, you're the best friends ever!" means
                    friendship is 180 or more. Battle bonuses are active.
                </li>
            </ul>
        </div>
    );
}

const guide = css`
    color: var(--color-text-secondary);

    h3 {
        margin: var(--space-4) 0 var(--space-2);
        color: var(--color-text);
        font-size: 1.6rem;
        font-weight: var(--font-weight-bold);
    }

    strong {
        color: var(--color-text);
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
