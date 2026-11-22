import { css, cx } from '@project-dragalge/css-in-js';
import { type CSSProperties, useMemo } from 'react';
import { PokemonIcon } from '../../components/PokemonIcon';
import { getPokemonTypeColor } from '../../utils/pokemon-type-colors';
import type { RunDifficulty, RunRating } from './difficulty-rating';
import { pickShowcase, SHOWCASE_SIZE } from './pick-showcase';
import type { MilestoneEntry, MilestoneSnapshot, MonoPlan } from './plan-types';

interface MonoPlanOverviewProps {
    plan: MonoPlan;
    /** How this type compares with the others, once all types are planned. */
    rating?: RunRating;
}

const DIFFICULTY_LABELS: Record<RunDifficulty, string> = {
    hard: 'Hard',
    medium: 'Medium',
    ok: 'OK',
};

/** E.g. "among the 5 hardest types"; tied types share a place. */
function describeRank(rating: RunRating): string {
    if (rating.place > 1) {
        return `among the ${rating.place} ${rating.end} types`;
    }
    return rating.tiedWith > 0
        ? `tied for the ${rating.end} type`
        : `the ${rating.end} type`;
}

export function MonoPlanOverview({ plan, rating }: MonoPlanOverviewProps) {
    const showcases = useMemo(
        () => pickShowcase(plan.milestones),
        [plan.milestones],
    );
    const { summary } = plan;

    return (
        <div className={overview}>
            <div className={summaryBlock}>
                {rating && (
                    <div>
                        Compared to the other types, this run is rated{' '}
                        <span className={levelClasses[rating.level]}>
                            {DIFFICULTY_LABELS[rating.level]}
                        </span>
                        : {describeRank(rating)}
                        {rating.fewEncounters
                            ? ` by its fights, but has only ${summary.totalEncounters} encounters.`
                            : '.'}
                    </div>
                )}
                <div className={muted}>
                    {summary.totalEncounters}{' '}
                    {summary.totalEncounters === 1 ? 'encounter' : 'encounters'}{' '}
                    by the end of the game. {summary.bosses} bosses:{' '}
                    {summary.ok} ok, {summary.orange} tricky, {summary.red}{' '}
                    hard.
                </div>
                <div className={muted}>
                    {plan.monoEligibleCount} mono-eligible Pokémon, counting
                    every evolution stage. Locations:{' '}
                    {summary.optionalLocations} optional,{' '}
                    {summary.guaranteedLocations} guaranteed,{' '}
                    {summary.skippedLocations} skipped.
                </div>
            </div>

            <div className={teamSection}>
                <div>What your team could look like</div>
                <ul className={milestoneList}>
                    {plan.milestones.map((milestone) => (
                        <MilestoneRow
                            key={milestone.id}
                            milestone={milestone}
                            shown={showcases.get(milestone.id) ?? []}
                        />
                    ))}
                </ul>
            </div>
        </div>
    );
}

interface MilestoneRowProps {
    milestone: MilestoneSnapshot;
    shown: MilestoneEntry[];
}

function MilestoneRow({ milestone, shown }: MilestoneRowProps) {
    const unavailable = milestone.entries.length === 0;
    const extra = Math.max(0, milestone.boxCount - shown.length);
    return (
        <li className={row}>
            <div className={rowLabel}>
                <span>{milestone.label}</span>
                <span className={cx(muted, small)}>
                    {unavailable
                        ? 'No eligible encounters yet'
                        : `${milestone.boxCount} ${milestone.boxCount === 1 ? 'encounter' : 'encounters'}`}
                </span>
            </div>
            {unavailable ? (
                <div
                    className={cx(group, unavailableGroup)}
                    title="No eligible encounters with this mono type until this point"
                >
                    <div className={blurred} aria-hidden="true">
                        {Array.from({ length: SHOWCASE_SIZE }, (_, index) => (
                            <span
                                key={index}
                                className={cx(slot, blurredSlot)}
                            />
                        ))}
                    </div>
                    <span className={cx(more, hidden)} aria-hidden="true" />
                    <span className={cx(notAvailable, muted)}>N/A</span>
                </div>
            ) : (
                <div className={group}>
                    {Array.from({ length: SHOWCASE_SIZE }, (_, index) => {
                        const entry = shown[index];
                        return entry ? (
                            <TeamIcon key={entry.formName} entry={entry} />
                        ) : (
                            <span
                                key={`empty-${index}`}
                                className={cx(slot, emptySlot)}
                            />
                        );
                    })}
                    <span
                        className={cx(more, extra > 0 ? moreFilled : hidden)}
                        title={
                            extra > 0
                                ? `Possible encounters: ${milestone.boxCount} Pokémon caught at this point, ${extra} more than the ones shown`
                                : undefined
                        }
                    >
                        {extra > 0 ? `+${extra}` : ''}
                    </span>
                </div>
            )}
        </li>
    );
}

/** The icon with a faded ring: half the first type's colour, half the second. */
function TeamIcon({ entry }: { entry: MilestoneEntry }) {
    const first = fade(entry.primaryType);
    const second = entry.secondaryType ? fade(entry.secondaryType) : first;
    const style = { '--ring-a': first, '--ring-b': second } as CSSProperties;
    const types = [entry.primaryType, entry.secondaryType]
        .filter(Boolean)
        .join('/');
    return (
        <span
            className={ring}
            style={style}
            title={`${entry.formName} (${types}): ${entry.locations.join(', ')}`}
        >
            <PokemonIcon
                name={entry.iconName}
                alt={entry.formName}
                size="lg"
                zoomed
            />
        </span>
    );
}

function fade(type: string): string {
    return `color-mix(in srgb, ${getPokemonTypeColor(type)} 45%, transparent)`;
}

const overview = css`
    --slot-size: 5.6rem;
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    font-size: var(--font-size-base);

    /* Smaller icons on a phone. The icons wrap when that is not enough. */
    @media (max-width: 34rem) {
        --slot-size: 3.6rem;
    }
`;

const summaryBlock = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
`;

const levelHard = css`
    color: var(--color-danger);
`;

const levelMedium = css`
    color: var(--color-warning);
`;

const levelOk = css`
    color: var(--color-success);
`;

const levelClasses: Record<RunDifficulty, string> = {
    hard: levelHard,
    medium: levelMedium,
    ok: levelOk,
};

const teamSection = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
`;

const milestoneList = css`
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
`;

const row = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2) var(--space-4);
    padding: var(--space-2) 0 var(--space-2) var(--space-3);

    &:nth-child(odd) {
        background: var(--color-surface-alt);
    }
`;

const rowLabel = css`
    display: flex;
    flex-direction: column;
`;

const small = css`
    font-size: var(--font-size-sm);
`;

/** The icons, left-aligned inside a group that sits at the right of the row. */
const group = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
    margin-left: auto;
`;

const unavailableGroup = css`
    position: relative;
`;

const ring = css`
    position: relative;
    display: inline-flex;
    flex-shrink: 0;

    /* The icon follows the slot size, which is smaller on a phone. */
    & > * {
        width: var(--slot-size);
        height: var(--slot-size);
    }

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        padding: 0.2rem;
        border-radius: var(--radius-sm);
        background: linear-gradient(
            135deg,
            var(--ring-a) 50%,
            var(--ring-b) 50%
        );
        -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
        mask-composite: exclude;
        pointer-events: none;
    }
`;

const slot = css`
    flex-shrink: 0;
    width: var(--slot-size);
    height: var(--slot-size);
    border-radius: var(--radius-sm);
`;

const blurredSlot = css`
    background: var(--color-border);
`;

const emptySlot = css`
    border: 0.1rem dashed var(--color-text-muted);
    opacity: 0.3;
`;

const more = css`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    min-width: var(--slot-size);
    height: var(--slot-size);
    border-radius: var(--radius-sm);
`;

const moreFilled = css`
    background: var(--color-surface-alt);
    color: var(--color-text-muted);
`;

/** Keeps the space of a "+X" chip that has nothing to show. */
const hidden = css`
    visibility: hidden;
`;

const blurred = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    filter: blur(0.4rem);
    opacity: 0.4;
    pointer-events: none;
    user-select: none;
`;

const notAvailable = css`
    position: absolute;
    left: var(--space-3);
`;

const muted = css`
    color: var(--color-text-muted);
`;
