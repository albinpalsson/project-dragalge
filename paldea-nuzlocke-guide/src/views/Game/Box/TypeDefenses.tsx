import { css, cx } from '@project-dragalge/css-in-js';
import { TypeBadge } from '../../../components/TypeBadge';
import { useTypeDefenses } from '../useTypeDefenses';

interface TypeDefensesProps {
    primaryType: string;
    secondaryType?: string;
    variant?: 'tooltip';
}

interface CanonicalName {
    // `short` is what remains visible on narrow screens; `rest` completes the
    // full word and is hidden there.
    short: string;
    rest: string;
}

function getCanonicalName(multiplier: number): CanonicalName {
    switch (multiplier) {
        case 0:
            return { short: 'Imm', rest: 'une' };
        case 0.25:
            return { short: 'Res', rest: 'istant' };
        case 0.5:
            return { short: 'Res', rest: 'istant' };
        case 2:
            return { short: 'Weak', rest: '' };
        case 4:
            return { short: 'Weak', rest: '' };
        default:
            return { short: 'Unknown', rest: '' };
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
                {entries.map((entry) => {
                    const name = getCanonicalName(entry.multiplier);
                    return (
                        <div
                            className={row}
                            key={entry.attackingType}
                            title={`${entry.attackingType}: ${entry.multiplier}×`}
                        >
                            <TypeBadge type={entry.attackingType} />
                            <span className={multiplier}>
                                {name.short}
                                <span className={nameRest}>{name.rest}</span>{' '}
                                {entry.multiplier}×
                            </span>
                        </div>
                    );
                })}
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

        @media (max-width: 48rem) {
                grid-template-columns: minmax(0, 1fr);
        }
`;

const row = css`
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
        padding-bottom: var(--space-2);
        border-bottom: 0.1rem solid var(--color-border);
        font-size: var(--font-size-sm);
`;

const multiplier = css`
  justify-self: end;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-muted);
`;

const nameRest = css`
    @media (max-width: 30rem) {
        display: none;
    }
`;
