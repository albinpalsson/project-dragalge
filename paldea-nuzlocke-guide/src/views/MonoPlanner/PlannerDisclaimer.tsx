import { css } from '@project-dragalge/css-in-js';
import { Tooltip } from '../../components/Tooltip';

/** Hover, focus or tap the label to read why the planner is experimental. */
export function PlannerDisclaimer() {
    return (
        <Tooltip
            // Grows to the left from the badge, so it stays on a phone screen.
            align="end"
            bubbleClassName={bubbleBelow}
            content={
                <span className={content}>
                    <span>
                        This feature does not meet the same quality standards as
                        the rest of the app.
                    </span>
                    <span>
                        - It uses simple calculations by design and has not been
                        thoroughly tested by hand.
                    </span>
                    <span>- It is not designed for mobile screens.</span>
                    <span>
                        - The ratings are a rough heads-up, not a promise.
                        Levels, movesets, items and how you play matter more
                        than the planner can see.
                    </span>
                </span>
            }
        >
            <button type="button" className={trigger}>
                <svg
                    viewBox="0 0 16 16"
                    className={warningIcon}
                    aria-hidden="true"
                >
                    <path d="M8 2.25 14.25 13.25H1.75Z" />
                    <path d="M8 6.5v3.25" />
                    <circle
                        cx="8"
                        cy="11.4"
                        r="0.55"
                        fill="currentColor"
                        stroke="none"
                    />
                </svg>
                Experimental feature
            </button>
        </Tooltip>
    );
}

const trigger = css`
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-1) var(--space-2);
    border: 0.1rem solid var(--color-warning);
    border-radius: var(--radius-sm);
    background: var(--color-warning-bg);
    color: var(--color-warning);
    font: inherit;
    font-size: var(--font-size-sm);
    cursor: pointer;

    &:hover {
        background: var(--color-surface-alt);
    }
`;

const warningIcon = css`
    width: 1.1em;
    height: 1.1em;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.4;
    stroke-linejoin: round;
    stroke-linecap: round;
`;

/**
 * Opens below, since this sits at the top of the page. A fixed width, since
 * the narrow trigger would otherwise squeeze the text.
 */
const bubbleBelow = css`
    top: calc(100% + var(--space-1));
    bottom: auto;
    width: 36rem;
    max-width: calc(100vw - 4.8rem);
`;

const content = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
`;
