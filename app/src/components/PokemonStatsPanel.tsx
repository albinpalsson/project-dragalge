import { css } from '@pokedb2/css-in-js';
import type { PokemonBaseStats } from '../db/pokemon-data/queries';
import { StatBar } from './StatBar';

interface PokemonStatsPanelProps {
    baseStats: PokemonBaseStats;
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

export function PokemonStatsPanel({ baseStats }: PokemonStatsPanelProps) {
    return (
        <div className={stats}>
            {statEntries(baseStats).map(([label, value]) => (
                <StatBar key={label} label={label} value={value} />
            ))}
        </div>
    );
}

const stats = css`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    grid-template-rows: repeat(3, auto);
    grid-auto-flow: column;
    column-gap: var(--space-3);
    row-gap: var(--space-2);
    margin: 0;
`;
