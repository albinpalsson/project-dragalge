import type { ReactNode } from 'react';
import { css } from '@project-dragalge/css-in-js';

interface IconLinkProps {
    label: string;
    href: string;
    children: ReactNode;
    external?: boolean;
}

export function IconLink({
    label,
    href,
    children,
    external = false,
}: IconLinkProps) {
    return (
        <a
            aria-label={label}
            title={label}
            href={href}
            className={iconLink}
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
        >
            {children}
        </a>
    );
}

const iconLink = css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: var(--radius-md);
  color: var(--color-text);
  transition: background-color 0.15s;

  &:hover {
    background: var(--color-hover-overlay);
  }

  &:focus-visible {
    outline: 0.2rem solid var(--color-accent);
    outline-offset: 0.1rem;
  }
`;
