import { css, cx } from '@project-dragalge/css-in-js';
import { TypeBadge } from '../../../components/TypeBadge';
import { useTypeDefenses } from '../useTypeDefenses';

interface TypeDefensesProps {
    primaryType: string;
    secondaryType?: string;
    variant?: 'tooltip';
}

function getCanonicalName(multiplier: number): string {
    switch (multiplier) {
        case 0:
            return 'Immune';
        case 0.25:
            return 'Resistant';
        case 0.5:
            return 'Resistant';
        case 2:
            return 'Weak';
        case 4:
            return 'Weak';
        default:
            return 'Unknown';
    }
}

export function TypeDefenses({
    primaryType,
    secondaryType,
    variant,
}: TypeDefensesProps) {
    const entries = useTypeDefenses(primaryType, secondaryType);

    if (entries.length === 0) {
        return null;
    }

    const defensiveTypes = secondaryType
        ? `${primaryType}/${secondaryType}`.toLowerCase()
        : primaryType.toLowerCase();

    return (
        <div
            className={cx(container, variant === 'tooltip' && tooltipContainer)}
        >
            <h5 className={title}>Type defenses ({defensiveTypes})</h5>
            <div className={list}>
                {entries.map((entry) => (
                    <div
                        className={row}
                        key={entry.attackingType}
                        title={`${entry.attackingType}: ${entry.multiplier}×`}
                    >
                        <TypeBadge type={entry.attackingType} />
                        <span className={multiplier}>
                            {getCanonicalName(entry.multiplier)}{' '}
                            {entry.multiplier}×
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}

const container = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const tooltipContainer = css`
        flex-basis: auto;
        min-width: 24rem;
`;

const title = css`
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: var(--space-2);
        margin: 0;
        padding-bottom: var(--space-1);
        border-bottom: 0.1rem solid var(--color-border);
        font-size: var(--font-size-sm);
        font-weight: 600;
        color: var(--color-text-muted);
`;

const list = css`
    display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        column-gap: var(--space-4);
        row-gap: var(--space-2);

        @media (max-width: 34rem) {
                grid-template-columns: minmax(0, 1fr);
        }
`;

const row = css`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
        padding-bottom: var(--space-2);
        border-bottom: 0.1rem solid var(--color-border);
        font-size: var(--font-size-sm);
`;

const multiplier = css`
  margin-left: auto;
    flex-shrink: 0;
    white-space: nowrap;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
`;
