import { css } from '@project-dragalge/css-in-js';

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

export function MailIcon() {
    return (
        <svg viewBox="0 0 16 16" className={icon} aria-hidden="true">
            <rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1" />
            <path d="M2.25 4.25 8 8.75l5.75-4.5" />
        </svg>
    );
}

export function GithubIcon() {
    return (
        <svg viewBox="0 0 16 16" className={kebabIcon} aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
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
