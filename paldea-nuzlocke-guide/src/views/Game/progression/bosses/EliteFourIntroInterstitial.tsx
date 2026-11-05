import { css } from '@project-dragalge/css-in-js';

export function EliteFourIntroInterstitial() {
    return <h2 className={heading}>The elite four</h2>;
}

const heading = css`
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: var(--space-4) 0 var(--space-2);
    color: var(--color-text-muted);
    font-size: var(--font-size-base);
    font-weight: inherit;

    &::before,
    &::after {
        content: '';
        flex: 1;
        border-top: 0.1rem solid var(--color-border);
    }
`;
