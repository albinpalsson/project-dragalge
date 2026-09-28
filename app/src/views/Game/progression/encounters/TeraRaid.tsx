import { useMemo } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Badge, BadgeButton } from '../../../../components/Badge';
import { Button } from '../../../../components/Button';
import { CollapsedSummaryRow } from '../../../../components/CollapsedSummaryRow';
import { PokemonAutocomplete } from '../../../../components/PokemonAutocomplete';
import { ProgressionCard } from '../../../../components/ProgressionCard';
import { ProgressionDescription } from '../../../../components/ProgressionDescription';
import { StatusChip } from '../../../../components/StatusChip';
import { useBanReasons } from '../../../../hooks/useBanReasons';
import { useEncounterActions } from '../../../../hooks/useEncounterActions';
import { usePokemonListQuery } from '../../../../hooks/usePokemonListQuery';
import { pokemonIconSrc, toIconSlug } from '../../../../pokemon-icon';
import { getRandomizerDisplayName } from '../../../../randomizer-groups';
import { getBanReason } from '../../../../utils/ban-list';
import {
    TERA_RAID_CAUGHT_LEVELS,
    formatTeraRaidDisplayName,
    formatTeraRaidLocationName,
    nextTeraRaidSequence,
    parseTeraRaidLocationName,
} from '../../../../utils/tera-raid-location';
import { useGame } from '../../GameContext';

interface TeraRaidProps {
    stars: number;
    isNext?: boolean;
}

export function TeraRaid({ stars, isNext }: TeraRaidProps) {
    const game = useGame();
    const pokemonQuery = usePokemonListQuery();
    const banReasons = useBanReasons();
    const encounterActions = useEncounterActions();

    const caughtLevel = TERA_RAID_CAUGHT_LEVELS[stars];
    const displayName = formatTeraRaidDisplayName(stars);
    const headingId = `tera-raid-${stars}-heading`;

    const rows = useMemo(
        () =>
            game.encounters
                .flatMap((row) => {
                    const parsed = parseTeraRaidLocationName(
                        row.location_name,
                    );
                    return parsed?.stars === stars
                        ? [{ row, sequence: parsed.sequence }]
                        : [];
                })
                .sort((a, b) => a.sequence - b.sequence),
        [game.encounters, stars],
    );

    const canAddMore =
        game.settings.teraRaids === 'unlimited' || rows.length === 0;
    const summaryStatus =
        rows.length === 1 &&
        (rows[0].row.status !== 'pending')
            ? rows[0].row.status
            : undefined;
    const suggestions = (pokemonQuery.data ?? []).filter(
        (name) => !getBanReason(banReasons, name),
    );

    const addPokemon = (pokemonName: string) => {
        const sequence = nextTeraRaidSequence(
            rows.map(({ row }) => row.location_name),
            stars,
        );
        void encounterActions.rollEncounter(
            pokemonName,
            formatTeraRaidLocationName(stars, sequence),
        );
    };

    return (
        <ProgressionCard
            compact
            isNext={isNext}
            ariaLabelledBy={headingId}
            defaultExpanded={false}
            collapsedContent={({ expand }) => (
                <CollapsedSummaryRow
                    icon={
                        <span className={starIcon} aria-hidden="true">
                            ✦
                        </span>
                    }
                    title={displayName}
                    detail={
                        rows.length > 0
                            ? `${rows.length} logged`
                            : undefined
                    }
                    leftBadges={
                        summaryStatus && (
                            <StatusChip status={summaryStatus} />
                        )
                    }
                    rightBadges={<Badge>Lv {caughtLevel}</Badge>}
                    isNext={isNext}
                    onExpand={expand}
                />
            )}
        >
            {({ collapse }) => (
                <>
                    <header className={header}>
                        <div>
                            <h3 id={headingId} className={heading}>
                                {displayName}
                            </h3>
                            <ProgressionDescription>
                                Sugggested: Search out a Tera Raid den and battle it —
                                the first {stars}-star raid you find is your
                                randomized encounter.
                            </ProgressionDescription>
                        </div>
                        <div className={badges}>
                            <Badge>Lv {caughtLevel}</Badge>
                            <BadgeButton
                                ariaLabel="Collapse Tera Raid"
                                title="Collapse Tera Raid"
                                onClick={collapse}
                            >
                                ▾ Fold
                            </BadgeButton>
                        </div>
                    </header>

                    {rows.length > 0 && (
                        <ul className={rowList}>
                            {rows.map(({ row }) => (
                                <li
                                    key={row.location_name}
                                    className={rowItem}
                                >
                                    <img
                                        className={rowIcon}
                                        src={pokemonIconSrc(
                                            toIconSlug(row.pokemon_name),
                                        )}
                                        alt={getRandomizerDisplayName(
                                            row.pokemon_name,
                                        )}
                                        loading="lazy"
                                    />
                                    <span className={rowName}>
                                        {getRandomizerDisplayName(
                                            row.pokemon_name,
                                        )}
                                    </span>
                                    <StatusChip status={row.status} />
                                    <div className={rowActions}>
                                        <Button
                                            variant="secondary"
                                            ariaLabel="Caught"
                                            title="Caught"
                                            onClick={() =>
                                                void encounterActions.catchEncounter(
                                                    row.location_name,
                                                )
                                            }
                                            disabled={
                                                encounterActions.isBusy ||
                                                row.status === 'caught'
                                            }
                                        >
                                            🎯
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            ariaLabel="Missed"
                                            title="Missed"
                                            onClick={() =>
                                                void encounterActions.missEncounter(
                                                    row.location_name,
                                                )
                                            }
                                            disabled={
                                                encounterActions.isBusy ||
                                                row.status === 'missed'
                                            }
                                        >
                                            🏃
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            ariaLabel="Eliminated"
                                            title="Eliminated"
                                            onClick={() =>
                                                void encounterActions.eliminateEncounter(
                                                    row.location_name,
                                                )
                                            }
                                            disabled={
                                                encounterActions.isBusy ||
                                                row.status === 'eliminated'
                                            }
                                        >
                                            💀
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            ariaLabel="Clear"
                                            title="Clear"
                                            onClick={() =>
                                                void encounterActions.clearEncounter(
                                                    row.location_name,
                                                )
                                            }
                                            disabled={encounterActions.isBusy}
                                        >
                                            ✕
                                        </Button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}

                    {canAddMore && (
                        <PokemonAutocomplete
                            label={`Add a ${stars}-star Tera Raid Pokémon`}
                            suggestions={suggestions}
                            onAdd={addPokemon}
                        />
                    )}
                </>
            )}
        </ProgressionCard>
    );
}

const starIcon = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3.2rem;
    height: 3.2rem;
    border-radius: var(--radius-sm);
    background: var(--color-surface-alt);
    color: var(--color-accent-warm);
    font-size: var(--font-size-lg);
`;

const header = css`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: var(--space-2);
`;

const heading = css`
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
`;

const badges = css`
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: var(--space-1);
`;

const rowList = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
`;

const rowItem = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-md);
`;

const rowIcon = css`
    width: 3.6rem;
    height: 3.6rem;
`;

const rowName = css`
    font-weight: var(--font-weight-bold);
`;

const rowActions = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    margin-left: auto;
`;
