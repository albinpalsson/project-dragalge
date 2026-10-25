import { css, cx } from '@project-dragalge/css-in-js';
import type { MouseEvent, ReactNode } from 'react';
import { CollapseButton } from './CollapseButton';

interface ProgressionCardHeaderProps {
    children: ReactNode;
    actions?: ReactNode;
    onCollapse?: () => void;
    collapseLabel?: string;
}

const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea';

/**
 * Click handler that collapses a card from anywhere on its header, except
 * from interactive descendants or while the user is selecting text.
 */
export function collapseOnHeaderClick(onCollapse: () => void) {
    return (event: MouseEvent<HTMLElement>) => {
        if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) {
            return;
        }
        if (window.getSelection()?.toString()) {
            return;
        }
        onCollapse();
    };
}

export function ProgressionCardHeader({
    children,
    actions,
    onCollapse,
    collapseLabel = 'Collapse',
}: ProgressionCardHeaderProps) {
    const hasActions = actions || onCollapse;

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: pointer shortcut; the collapse button is the keyboard and screen-reader path
        <header
            className={cx(header, onCollapse && clickable)}
            onClick={onCollapse && collapseOnHeaderClick(onCollapse)}
        >
            <div className={content}>{children}</div>
            {hasActions && (
                <div className={actionsStyle}>
                    {actions}
                    {onCollapse && (
                        <CollapseButton
                            onClick={onCollapse}
                            label={collapseLabel}
                        />
                    )}
                </div>
            )}
        </header>
    );
}

const header = css`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: 0.1rem solid var(--color-border);
`;

const clickable = css`
    cursor: pointer;
`;

const content = css`
    min-width: 0;
`;

const actionsStyle = css`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    align-items: center;
    gap: var(--space-1);
`;
