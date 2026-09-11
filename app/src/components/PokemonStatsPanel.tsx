import { css } from '@pokedb2/css-in-js';
import type { PokemonBaseStats } from '../db/pokemon-data/queries';

interface PokemonStatsPanelProps {
    baseStats: PokemonBaseStats;
}

function statEntries(baseStats: PokemonBaseStats): [string, number][] {
    return [
        ['HP', baseStats.hp],
        ['Attack', baseStats.attack],
        ['Defense', baseStats.defense],
        ['Sp. Atk', baseStats.specialAttack],
        ['Sp. Def', baseStats.specialDefense],
        ['Speed', baseStats.speed],
    ];
}

export function PokemonStatsPanel({ baseStats }: PokemonStatsPanelProps) {
    return (
        <dl className={stats}>
            {statEntries(baseStats).map(([label, value]) => (
                <div className={stat} key={label}>
                    <dt className={muted}>{label}</dt>
                    <dd className={statValue}>{value}</dd>
                </div>
            ))}
        </dl>
    );
}

const stats = css`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-2);
    margin: var(--space-2) 0;
`;

const stat = css`
    display: flex;
    flex-direction: column;
`;

const muted = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: var(--space-1);
`;

const statValue = css`
    font-size: var(--font-size-lg);
    font-weight: 600;
`;
