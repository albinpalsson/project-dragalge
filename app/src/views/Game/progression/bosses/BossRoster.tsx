import { css } from '@pokedb2/css-in-js';
import { BossPokemonCard } from './BossPokemonCard';
import type {
    BossBattleRoster,
    BossPokemonView,
} from '../../../../db/pokemon-data/queries';

interface BossRosterProps {
    title: string;
    roster: BossBattleRoster;
}

export function BossRoster({ title, roster }: BossRosterProps) {
    return (
        <div className={container}>
            <div className={header}>
                <h3 className={titleClass}>{title}</h3>
                <span className={type}>{roster.battleType}</span>
            </div>
            <div className={pokemonList}>
                {roster.pokemon.map((pokemon: BossPokemonView) => (
                    <BossPokemonCard
                        key={pokemon.pokemonName}
                        pokemon={pokemon}
                    />
                ))}
            </div>
        </div>
    );
}

const container = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
`;

const header = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
`;

const titleClass = css`
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: 600;
`;

const type = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    text-transform: uppercase;
`;

const pokemonList = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;
