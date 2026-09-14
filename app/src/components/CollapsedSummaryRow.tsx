import { css, cx } from '@pokedb2/css-in-js';
import type { ReactNode } from 'react';
import { nextHighlight } from './progression-highlight';

interface CollapsedSummaryRowProps {
    icon: ReactNode;
    label: ReactNode;
    title: ReactNode;
    leftBadges?: ReactNode;
    rightBadges?: ReactNode;
    onExpand: () => void;
    isNext?: boolean;
}

export function CollapsedSummaryRow({
    icon,
    label,
    title,
    leftBadges,
    rightBadges,
    onExpand,
    isNext,
}: CollapsedSummaryRowProps) {
    return (
        <button
            type="button"
            className={cx(row, isNext && nextHighlight)}
            onClick={onExpand}
        >
            {icon}
            <span className={labelText}>{label}</span>
            <span className={titleText}>{title}</span>
            {leftBadges}
            <span className={rightCluster}>
                {rightBadges}
                <span className={chevron} aria-hidden="true">
                    ▸
                </span>
            </span>
        </button>
    );
}

const row = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;

const labelText = css`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
`;

const titleText = css`
  font-weight: var(--font-weight-bold);
`;

const rightCluster = css`
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
`;

const chevron = css`
  color: var(--color-text-muted);
`;
