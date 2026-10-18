import { css } from '@project-dragalge/css-in-js';
import type { PokemonBaseStats } from '../db/pokemon-data/queries';
import { StatBar } from './StatBar';
import { Tooltip } from './Tooltip';

interface PokemonStatsPanelProps {
    baseStats: PokemonBaseStats;
    equivalent?: boolean;
}

function statEntries(baseStats: PokemonBaseStats): [string, number][] {
    return [
        ['HP', baseStats.hp],
        ['Atk', baseStats.attack],
        ['Def', baseStats.defense],
        ['Sp. Atk', baseStats.specialAttack],
        ['Sp. Def', baseStats.specialDefense],
        ['Speed', baseStats.speed],
    ];
}

export function PokemonStatsPanel({
    baseStats,
    equivalent,
}: PokemonStatsPanelProps) {
    const total = Object.values(baseStats).reduce(
        (sum, value) => sum + value,
        0,
    );

    return (
        <div>
            <h5 className={sectionTitle}>
                {equivalent ? (
                    <Tooltip content="Equivalent base stats based on exact stat values, calculated for comparison.">
                        <button type="button" className={equivalentLabel}>
                            EQUIVALENT BASE STATS
                        </button>
                    </Tooltip>
                ) : (
                    <span>BASE STATS</span>
                )}
                <span className={statTotal}>Total: {total}</span>
            </h5>
            <div className={stats}>
                {statEntries(baseStats).map(([label, value]) => (
                    <StatBar key={label} label={label} value={value} />
                ))}
            </div>
        </div>
    );
}

const sectionTitle = css`
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

const equivalentLabel = css`
    padding: 0;
    border: 0;
    background: none;
    color: inherit;
    font: inherit;
    text-align: left;
    text-transform: inherit;
    cursor: help;
`;

const statTotal = css`
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-transform: none;
`;

const stats = css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, auto);
    grid-auto-flow: column;
    column-gap: var(--space-3);
    row-gap: var(--space-2);
    margin: var(--space-2) 0 0;
`;
