import { css } from '@pokedb2/css-in-js';
import type { ReactNode } from 'react';
import { Badge, BadgeButton } from '../../../../components/Badge';
import type { PokemonIconSize } from '../../../../components/PokemonIcon';
import { ProgressionCardHeader } from '../../../../components/ProgressionCardHeader';
import { StatusChip } from '../../../../components/StatusChip';
import { TypeBadge } from '../../../../components/TypeBadge';
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
    icon?: ReactNode;
    specialtyType?: string;
}

export interface TeraAce {
    pokemonName: string;
    teraType: string;
}

interface BossRosterProps {
    roster: BossBattleRoster;
    teraAce?: TeraAce;
    iconSize: PokemonIconSize;
    zoomedIcon?: boolean;
}

export function BossHeader({
    locationName,
    displayBattleName,
    levelCap,
    onCollapse,
    currentResult,
    icon = '⚔',
    specialtyType,
}: BossHeaderProps) {
    return (
        <ProgressionCardHeader
            actions={
                <>
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
                </>
            }
        >
            <div>
                <div className={titleRow}>
                    <span className={battleIcon} aria-hidden="true">
                        {icon}
                    </span>
                    <h3 className={titleClass}>{displayBattleName}</h3>
                    {specialtyType && <TypeBadge type={specialtyType} />}
                    {currentResult && <StatusChip status={currentResult} />}
                </div>
                <p className={subtitle}>{locationName}</p>
            </div>
        </ProgressionCardHeader>
    );
}

export function BossRoster({
    roster,
    teraAce,
    iconSize,
    zoomedIcon,
}: BossRosterProps) {
    return (
        <div className={pokemonList}>
            {roster.pokemon.map((pokemon: BossPokemonView) => (
                <BossPokemonCard
                    key={pokemon.pokemonName}
                    pokemon={pokemon}
                    iconSize={iconSize}
                    zoomedIcon={zoomedIcon}
                    teraType={
                        teraAce?.pokemonName === pokemon.pokemonName
                            ? teraAce.teraType
                            : undefined
                    }
                />
            ))}
        </div>
    );
}

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
    filter: grayscale(1);
    opacity: 0.78;
`;

const subtitle = css`
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const pokemonList = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
`;
