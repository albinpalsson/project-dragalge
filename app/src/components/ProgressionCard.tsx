import { css, cx } from '@pokedb2/css-in-js';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { nextHighlight } from './progression-highlight';

interface ProgressionCardRenderProps {
    isExpanded: boolean;
    expand: () => void;
    collapse: () => void;
}

interface ProgressionCardProps {
    className?: string;
    children: ReactNode | ((props: ProgressionCardRenderProps) => ReactNode);
    collapsedContent?:
        | ReactNode
        | ((props: ProgressionCardRenderProps) => ReactNode);
    defaultExpanded?: boolean;
    expandWhen?: boolean;
    compact?: boolean;
    isNext?: boolean;
    ariaLabelledBy?: string;
}

export function ProgressionCard({
    className,
    children,
    collapsedContent,
    defaultExpanded = true,
    expandWhen,
    compact,
    isNext,
    ariaLabelledBy,
}: ProgressionCardProps) {
    const [isExpanded, setExpanded] = useState(defaultExpanded);

    useEffect(() => {
        if (expandWhen) {
            setExpanded(true);
        }
    }, [expandWhen]);

    const renderProps: ProgressionCardRenderProps = {
        isExpanded,
        expand: () => setExpanded(true),
        collapse: () => setExpanded(false),
    };

    if (!isExpanded && collapsedContent) {
        return (
            <div className={collapsedShell}>
                {typeof collapsedContent === 'function'
                    ? collapsedContent(renderProps)
                    : collapsedContent}
            </div>
        );
    }

    return (
        <article
            className={cx(
                card,
                className,
                compact && compactCard,
                isNext && nextHighlight,
            )}
            aria-labelledby={ariaLabelledBy}
        >
            {typeof children === 'function' ? children(renderProps) : children}
        </article>
    );
}

const card = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    min-width: 0;
    padding: var(--space-4);
    background: var(--color-surface);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
`;

const compactCard = css`
    && {
        gap: var(--space-2);
        padding: var(--space-3);
    }
`;

const collapsedShell = css`
    width: 100%;
    min-width: 0;
`;
