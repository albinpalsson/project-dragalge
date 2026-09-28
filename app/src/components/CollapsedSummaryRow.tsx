import { css, cx } from '@pokedb2/css-in-js';
import type { ReactNode } from 'react';
import { nextHighlight } from './progression-highlight';

interface CollapsedSummaryRowProps {
    className?: string;
    icon: ReactNode;
    label?: ReactNode;
    title: ReactNode;
    detail?: ReactNode;
    leftBadges?: ReactNode;
    rightBadges?: ReactNode;
    onExpand: () => void;
    isNext?: boolean;
}

export function CollapsedSummaryRow({
    className,
    icon,
    label,
    title,
    detail,
    leftBadges,
    rightBadges,
    onExpand,
    isNext,
}: CollapsedSummaryRowProps) {
    return (
        <button
            type="button"
            className={cx(row, className, isNext && nextHighlight)}
            onClick={onExpand}
        >
            {icon}
            <span className={summaryText}>
                {label && <span className={labelText}>{label}</span>}
                <span className={titleText}>{title}</span>
                {detail && <span className={detailText}>{detail}</span>}
            </span>
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

  &&:hover {
    background: var(--color-hover-overlay);
  }
`;

const labelText = css`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
`;

const summaryText = css`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const titleText = css`
  overflow: hidden;
  font-weight: var(--font-weight-bold);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const detailText = css`
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
