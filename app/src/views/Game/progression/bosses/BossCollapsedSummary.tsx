import { css } from '@pokedb2/css-in-js';
import type { ReactNode } from 'react';
import { Badge } from '../../../../components/Badge';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { StatusChip } from '../../../../components/StatusChip';
import { TypeBadge } from '../../../../components/TypeBadge';

interface BossCollapsedSummaryProps {
    battleName: string;
    className?: string;
    locationName: string;
    result: 'won' | 'lost' | undefined;
    levelCap: number;
    isNext?: boolean;
    onExpand: () => void;
    icon?: ReactNode;
    specialtyType?: string;
}

export function BossCollapsedSummary({
    battleName,
    className,
    locationName,
    result,
    levelCap,
    isNext,
    onExpand,
    icon = '⚔',
    specialtyType,
}: BossCollapsedSummaryProps) {
    return (
        <CollapsedSummaryRow
            className={className}
            icon={
                <span className={iconStyle} aria-hidden="true">
                    {icon}
                </span>
            }
            label={locationName}
            title={battleName}
            leftBadges={
                <>
                    {specialtyType && <TypeBadge type={specialtyType} />}
                    {result && <StatusChip status={result} />}
                </>
            }
            rightBadges={<Badge>Lv cap {levelCap}</Badge>}
            isNext={isNext}
            onExpand={onExpand}
        />
    );
}

const iconStyle = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: var(--font-size-lg);
    filter: grayscale(1);
    opacity: 0.78;
`;
