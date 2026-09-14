import { css } from '@pokedb2/css-in-js';
import { Badge, BadgeButton } from '../../../../components/Badge';
import { BossPokemonCard } from './BossPokemonCard';
import type {
    BossBattleRoster,
    BossPokemonView,
} from '../../../../db/pokemon-data/queries';

interface BossRosterProps {
    locationName: string;
    roster: BossBattleRoster;
    onCollapse?: () => void;
    showTeam: boolean;
}

export function BossRoster({
    locationName,
    roster,
    onCollapse,
    showTeam,
}: BossRosterProps) {
    const levelCap = Math.max(
        ...roster.pokemon.map((pokemon) => pokemon.level),
    );

    return (
        <div className={container}>
            <div className={header}>
                <div>
                    <h3 className={titleClass}>{roster.battleName}</h3>
                    <p className={subtitle}>{locationName}</p>
                </div>
                <div className={badges}>
                    <Badge>Lv {levelCap}</Badge>
                    <Badge uppercase>{roster.battleType}</Badge>
                    {onCollapse && (
                        <BadgeButton
                            onClick={onCollapse}
                            ariaLabel="Collapse boss fight"
                            title="Collapse boss fight"
                        >
                            ▾ Fold
                        </BadgeButton>
                    )}
                </div>
            </div>
            {showTeam && (
                <div className={pokemonList}>
                    {roster.pokemon.map((pokemon: BossPokemonView) => (
                        <BossPokemonCard
                            key={pokemon.pokemonName}
                            pokemon={pokemon}
                        />
                    ))}
                </div>
            )}
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
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2);
`;

const titleClass = css`
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
`;

const subtitle = css`
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const badges = css`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1);
`;

const pokemonList = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;
