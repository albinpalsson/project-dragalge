import { css, cx } from '@pokedb2/css-in-js';
import { Badge } from '../../../../components/Badge';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { StatusChip } from '../../../../components/StatusChip';

interface BossCollapsedSummaryProps {
    battleName: string;
    className?: string;
    locationName: string;
    result: 'won' | 'lost' | undefined;
    levelCap: number;
    isNext?: boolean;
    onExpand: () => void;
}

export function BossCollapsedSummary({
    battleName,
    className,
    locationName,
    result,
    levelCap,
    isNext,
    onExpand,
}: BossCollapsedSummaryProps) {
    return (
        <CollapsedSummaryRow
            className={cx(bossAccent, className)}
            icon={
                <span className={icon} aria-hidden="true">
                    ⚔
                </span>
            }
            label={locationName}
            title={battleName}
            leftBadges={result && <StatusChip status={result} />}
            rightBadges={<Badge>Lv cap {levelCap}</Badge>}
            isNext={isNext}
            onExpand={onExpand}
        />
    );
}

const icon = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
`;

const bossAccent = css`
    && {
        border-color: var(--color-border);
        border-left: 0.4rem solid var(--color-accent-warm);
        box-shadow: none;
    }
`;
