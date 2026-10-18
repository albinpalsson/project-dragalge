import { css } from '@project-dragalge/css-in-js';

export function ChampionCompleteInterstitial() {
    return (
        <section className={container} aria-label="Nuzlocke complete">
            <h2 className={heading}>
                <span className={decoration} aria-hidden="true">
                    🎉
                </span>
                <span>Nuzlocke complete</span>
                <span className={decoration} aria-hidden="true">
                    🏆
                </span>
            </h2>
            <p className={description}>
                You are now the Paldea Champion. At this point, you can consider
                the Nuzlocke complete. Of course, it's your run and your rules,
                and there's more of the game to play. If your team is still able
                to battle and you're interested in a bonus challenge, consider
                heading straight to Mesagoza for one more back-to-back battle
                against Nemona.
            </p>
        </section>
    );
}

const container = css`
    max-width: 56rem;
    margin: var(--space-4) auto;
    padding: var(--space-4) var(--space-2);
    color: var(--color-text-muted);
    text-align: center;
`;

const heading = css`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    margin: 0 0 var(--space-2);
    font-size: var(--font-size-base);
`;

const decoration = css`
    filter: grayscale(1);
    opacity: 0.55;
`;

const description = css`
    max-width: 48rem;
    margin: 0 auto;
    font-size: var(--font-size-sm);
    line-height: 1.5;
    text-align: left;
`;
