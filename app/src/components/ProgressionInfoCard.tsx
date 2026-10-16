import { css } from '@pokedb2/css-in-js';
import { useId } from 'react';
import type { ReactNode } from 'react';
import { BadgeButton } from './Badge';
import { CollapsedSummaryRow } from './CollapsedSummaryRow';
import { InfoIcon } from './icons';
import { ProgressionCard } from './ProgressionCard';
import { ProgressionCardHeader } from './ProgressionCardHeader';

interface ProgressionInfoCardProps {
    title: string;
    children: ReactNode;
}

export function ProgressionInfoCard({
    title,
    children,
}: ProgressionInfoCardProps) {
    const headingId = useId();

    return (
        <ProgressionCard
            className={infoCard}
            compact
            defaultExpanded={false}
            ariaLabelledBy={headingId}
            collapsedContent={({ expand }) => (
                <CollapsedSummaryRow
                    className={infoSummary}
                    icon={<InfoIcon />}
                    title={title}
                    ariaExpanded={false}
                    onExpand={expand}
                />
            )}
        >
            {({ collapse, isExpanded }) => (
                <>
                    <ProgressionCardHeader
                        actions={
                            <BadgeButton
                                ariaLabel={`Collapse ${title}`}
                                title={`Collapse ${title}`}
                                ariaExpanded={isExpanded}
                                onClick={collapse}
                            >
                                ▾ Fold
                            </BadgeButton>
                        }
                    >
                        <div className={heading}>
                            <InfoIcon />
                            <h3 id={headingId}>{title}</h3>
                        </div>
                    </ProgressionCardHeader>
                    <div className={body}>{children}</div>
                </>
            )}
        </ProgressionCard>
    );
}

const infoCard = css`
    && {
        background: var(--color-info-bg);
        border: 0;
        color: var(--color-text-secondary);
        padding: calc(var(--space-2) + 0.1rem)
            calc(var(--space-3) + 0.1rem);
    }
`;

const infoSummary = css`
    && {
        background: var(--color-info-bg);
        border: 0;
        color: var(--color-text-secondary);
    }

    &&:hover {
        background: var(--color-info-bg);
    }
`;

const heading = css`
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    min-width: 0;

    > svg {
        color: var(--color-info);
    }

    > h3 {
        min-width: 0;
        margin: 0;
        font: inherit;
        font-weight: var(--font-weight-bold);
    }
`;

const body = css`
    min-width: 0;
    max-width: 58rem;
    color: var(--color-text-secondary);

    > :first-child {
        margin-top: 0;
    }

    > :last-child {
        margin-bottom: 0;
    }
`;
