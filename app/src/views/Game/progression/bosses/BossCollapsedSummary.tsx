import { css } from '@pokedb2/css-in-js';
import { Badge } from '../../../../components/Badge';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { StatusChip } from '../../../../components/StatusChip';
import { pokemonIconSrc, toIconSlug } from '../../../../pokemon-icon';

interface BossCollapsedSummaryProps {
    battleName: string;
    result: 'won' | 'lost' | undefined;
    acePokemonName: string;
    levelCap: number;
    isNext?: boolean;
    onExpand: () => void;
}

export function BossCollapsedSummary({
    battleName,
    result,
    acePokemonName,
    levelCap,
    isNext,
    onExpand,
}: BossCollapsedSummaryProps) {
    return (
        <CollapsedSummaryRow
            icon={
                <img
                    className={icon}
                    src={pokemonIconSrc(toIconSlug(acePokemonName))}
                    alt={acePokemonName}
                    loading="lazy"
                />
            }
            label="Boss Fight"
            title={battleName}
            leftBadges={<StatusChip status={result ?? 'pending-result'} />}
            rightBadges={<Badge>Lv {levelCap}</Badge>}
            isNext={isNext}
            onExpand={onExpand}
        />
    );
}

const icon = css`
  width: 3.2rem;
  height: 3.2rem;
`;
