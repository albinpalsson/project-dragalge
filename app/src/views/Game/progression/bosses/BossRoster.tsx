import { css } from '@pokedb2/css-in-js';
import { Badge, BadgeButton } from '../../../../components/Badge';
import { StatusChip } from '../../../../components/StatusChip';
import { BossPokemonCard } from './BossPokemonCard';
import type {
    BossBattleRoster,
    BossPokemonView,
} from '../../../../db/pokemon-data/queries';

interface BossHeaderProps {
    locationName: string;
    displayBattleName: string;
    levelCap: number;
    onCollapse?: () => void;
    currentResult?: 'won' | 'lost';
}

interface BossRosterProps {
    roster: BossBattleRoster;
}

export function BossHeader({
    locationName,
    displayBattleName,
    levelCap,
    onCollapse,
    currentResult,
}: BossHeaderProps) {
    return (
        <div className={header}>
            <div>
                <div className={titleRow}>
                    <span className={battleIcon} aria-hidden="true">
                        ⚔
                    </span>
                    <h3 className={titleClass}>{displayBattleName}</h3>
                    {currentResult && <StatusChip status={currentResult} />}
                </div>
                <p className={subtitle}>{locationName}</p>
            </div>
            <div className={badges}>
                <Badge>Lv cap {levelCap}</Badge>
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
    );
}

export function BossRoster({ roster }: BossRosterProps) {
    return (
        <div className={pokemonList}>
            {roster.pokemon.map((pokemon: BossPokemonView) => (
                <BossPokemonCard key={pokemon.pokemonName} pokemon={pokemon} />
            ))}
        </div>
    );
}

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

const titleRow = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
`;

const battleIcon = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    font-size: var(--font-size-base);
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
    flex-wrap: wrap;
    gap: var(--space-2);
`;
