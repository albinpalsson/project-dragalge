import { css } from '@pokedb2/css-in-js';

export function MenuIcon() {
    return (
        <svg viewBox="0 0 16 16" className={icon} aria-hidden="true">
            <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
        </svg>
    );
}

export function BoxIcon() {
    return (
        <svg viewBox="0 0 16 16" className={icon} aria-hidden="true">
            <rect x="1.75" y="2.75" width="12.5" height="3.5" rx="0.75" />
            <path d="M2.75 6.25v6.25a.75.75 0 0 0 .75.75h9a.75.75 0 0 0 .75-.75V6.25" />
            <path d="M6.5 9h3" />
        </svg>
    );
}

export function KebabIcon() {
    return (
        <svg viewBox="0 0 16 16" className={kebabIcon} aria-hidden="true">
            <circle cx="8" cy="3" r="1.35" />
            <circle cx="8" cy="8" r="1.35" />
            <circle cx="8" cy="13" r="1.35" />
        </svg>
    );
}

export function InfoIcon() {
    return (
        <svg viewBox="0 0 16 16" className={icon} aria-hidden="true">
            <circle cx="8" cy="8" r="6.25" />
            <path d="M8 7.25v4" />
            <circle cx="8" cy="5" r="0.55" fill="currentColor" stroke="none" />
        </svg>
    );
}

const icon = css`
  width: 1.8rem;
  height: 1.8rem;
  flex: none;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
`;

const kebabIcon = css`
    width: 1.6rem;
    height: 1.6rem;
    flex: none;
    fill: currentColor;
`;
