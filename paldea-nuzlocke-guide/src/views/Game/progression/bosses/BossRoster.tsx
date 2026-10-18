import { css } from '@project-dragalge/css-in-js';
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
import { formatLocationName } from '../../../../utils/encounter-formatters';

export interface BossRosterPokemon extends BossPokemonView {
    displayName?: string;
    equivalentBaseStats?: boolean;
}

export interface BossRosterView extends BossBattleRoster {
    pokemon: BossRosterPokemon[];
}

interface BossHeaderProps {
    locationName: string;
    displayBattleName: string;
    levelCap: number;
    onCollapse?: () => void;
    currentResult?: 'won' | 'lost';
    icon?: ReactNode;
    specialtyType?: string;
}

interface BossRosterProps {
    roster: BossRosterView;
    teraType?: string;
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
                    {!currentResult && <Badge>Lv cap {levelCap}</Badge>}
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
                    <span className={badgeGroup}>
                        {specialtyType && <TypeBadge type={specialtyType} />}
                        {currentResult && <StatusChip status={currentResult} />}
                    </span>
                </div>
                <p className={subtitle}>{formatLocationName(locationName)}</p>
            </div>
        </ProgressionCardHeader>
    );
}

export function BossRoster({
    roster,
    teraType,
    iconSize,
    zoomedIcon,
}: BossRosterProps) {
    const orderedPokemon = [...roster.pokemon].sort(
        (first, second) => first.slot - second.slot,
    );
    const aceSlot = orderedPokemon.at(-1)?.slot;

    return (
        <div className={pokemonList}>
            {orderedPokemon.map((pokemon) => (
                <BossPokemonCard
                    key={pokemon.slot}
                    pokemon={pokemon}
                    iconSize={iconSize}
                    zoomedIcon={zoomedIcon}
                    teraType={pokemon.slot === aceSlot ? teraType : undefined}
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

const badgeGroup = css`
    display: inline-flex;
    align-items: center;
    gap: var(--space-3);
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
