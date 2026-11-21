import { css, cx } from '@project-dragalge/css-in-js';
import { PokemonIcon } from '../../components/PokemonIcon';
import { TypeBadge } from '../../components/TypeBadge';
import { BASE_STAT_TIERS } from './plan-bosses';
import type {
    BossCandidate,
    BossMatchupTrace,
    BossMemberTrace,
    BossStep,
    LocationStep,
    MonoPlan,
    PoolSpecies,
} from './plan-types';

interface MonoPlanStepsProps {
    plan: MonoPlan;
    /** Off shows only the bosses with an orange or red warning. */
    showAll: boolean;
}

export function MonoPlanSteps({ plan, showAll }: MonoPlanStepsProps) {
    // Everything before the first eligible Pokémon. Fights there cannot be
    // answered at all, so they are folded away instead of listed as warnings.
    const firstPokemon = plan.steps.findIndex(
        (step) => step.kind === 'location' && step.outcome !== 'skipped',
    );
    const prefixLength = firstPokemon < 0 ? plan.steps.length : firstPokemon;
    const prefix = plan.steps.slice(0, prefixLength);
    const skippedFights = prefix.filter((step) => step.kind === 'boss').length;
    const hasFoldedPrefix = skippedFights > 0;

    const rest = hasFoldedPrefix ? plan.steps.slice(prefixLength) : plan.steps;
    const steps = showAll
        ? rest
        : rest.filter((step) => step.kind === 'boss' && step.level !== 'ok');

    return (
        <>
            {hasFoldedPrefix && (
                <details className={foldedNotice}>
                    <summary>
                        <span className={icon} aria-hidden="true">
                            ⚠️
                        </span>{' '}
                        Your run might have to exclude {skippedFights}{' '}
                        {skippedFights === 1 ? 'fight' : 'fights'}, since there
                        are no eligible encounters with this mono type until
                        this point
                    </summary>
                    <StepList steps={prefix} />
                </details>
            )}
            {steps.length > 0 ? (
                <StepList steps={steps} />
            ) : (
                <p className={allClear}>
                    <span className={icon} aria-hidden="true">
                        ✅
                    </span>{' '}
                    No especially tricky or hard bosses with these settings.
                </p>
            )}
        </>
    );
}

function StepList({ steps }: { steps: MonoPlan['steps'] }) {
    return (
        <ol className={list}>
            {steps.map((step) =>
                step.kind === 'location' ? (
                    <LocationEntry key={step.key} step={step} />
                ) : (
                    <BossEntry key={step.key} step={step} />
                ),
            )}
        </ol>
    );
}

function LocationEntry({ step }: { step: LocationStep }) {
    return (
        <li className={entry}>
            <div>
                <strong>{step.locationName}</strong>{' '}
                <span className={muted}>{describeOutcome(step)}</span>
            </div>
            <details className={disclosure}>
                <summary>Details</summary>
                <div className={details}>
                    {step.note && <div className={muted}>{step.note}</div>}
                    {step.activeGuaranteedBans.length > 0 && (
                        <div className={muted}>
                            Dupes clause bans from earlier guaranteed
                            encounters: {step.activeGuaranteedBans.join(', ')}
                        </div>
                    )}
                    <ul className={stageList}>
                        {step.stages.map((stage, index) => (
                            <li key={stage.label}>
                                <span>
                                    {stage.label}: {stage.speciesCount}
                                </span>
                                {index === 0 && stage.names.length > 0 && (
                                    <span className={muted}>
                                        {' '}
                                        ({stage.names.join(', ')})
                                    </span>
                                )}
                                {stage.removed.length > 0 && (
                                    <span className={muted}>
                                        {' '}
                                        removed:{' '}
                                        {stage.removed
                                            .map(
                                                (removed) =>
                                                    `${removed.name} (${removed.reason})`,
                                            )
                                            .join(', ')}
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                    {step.pool.length > 0 && (
                        <div>
                            Pool:{' '}
                            {step.pool.map(describePoolSpecies).join('; ')}
                        </div>
                    )}
                </div>
            </details>
        </li>
    );
}

function describeOutcome(step: LocationStep): string {
    if (step.outcome === 'skipped') {
        return 'skipped, no encounter';
    }
    if (step.outcome === 'guaranteed') {
        return `guaranteed: ${step.pool[0].name}`;
    }
    return `optional encounter, ${step.pool.length} possible species`;
}

function describePoolSpecies(species: PoolSpecies): string {
    const types = formatTypes(species);
    return `${species.name} (${types}, ${Math.round(species.chance * 100)}%)`;
}

function formatTypes(typing: {
    primaryType: string;
    secondaryType: string;
}): string {
    return [typing.primaryType, typing.secondaryType].filter(Boolean).join('/');
}

const LEVEL_LABELS = {
    ok: 'OK',
    orange: 'Tricky',
    red: 'Hard',
} as const;

function BossEntry({ step }: { step: BossStep }) {
    const candidates = [...step.guaranteed, ...step.optional];
    const fullAnswerAt =
        step.unanswered.length > 0 ? Number.POSITIVE_INFINITY : 1;
    const groups = [
        {
            label: 'Full answer (holds and trades evenly against at least half the team)',
            short: 'full',
            items: candidates.filter(
                (candidate) => candidate.answer >= fullAnswerAt,
            ),
        },
        {
            label: 'Partial answer',
            short: 'partial',
            items: candidates.filter(
                (candidate) =>
                    candidate.answer > 0 && candidate.answer < fullAnswerAt,
            ),
        },
        {
            label: 'No answer (weak to a threat from every Pokémon on the team)',
            short: 'none',
            items: candidates.filter(
                (candidate) => candidate.form && candidate.answer === 0,
            ),
        },
        {
            label: 'Not usable',
            short: 'unusable',
            items: candidates.filter((candidate) => !candidate.form),
        },
    ].filter((group) => group.items.length > 0);

    return (
        <li className={cx(entry, bossEntry)}>
            <div className={bossHeader}>
                <strong>{step.label}</strong>
                {step.starType && <TypeBadge type={step.starType} />}
                {step.teraType && (
                    <TypeBadge type={step.teraType} variant="tera" />
                )}
                <strong
                    className={cx(
                        step.level === 'red' && red,
                        step.level === 'orange' && orange,
                    )}
                >
                    {LEVEL_LABELS[step.level]}
                </strong>
            </div>
            {step.unanswered.length > 0 && (
                <div>
                    No available Pokémon can take hits from{' '}
                    {step.unanswered.join(', ')}.
                </div>
            )}
            <details className={disclosure}>
                <summary>How the score is calculated</summary>
                <div className={details}>
                    {step.fullyEvolved && (
                        <div className={muted}>
                            Assumes every Pokémon has evolved as far as the run
                            allows (stones, trades and levels included), so
                            unevolved forms are not counted.
                        </div>
                    )}
                    <div>
                        Score <strong>{formatNumber(step.score)}</strong> (needs{' '}
                        {step.required} for OK, {formatNumber(step.orangeAt)}{' '}
                        for Tricky) | opponent weight {step.totalWeight} |
                        answers:{' '}
                        {groups
                            .map(
                                (group) =>
                                    `${group.items.length} ${group.short}`,
                            )
                            .join(', ')}
                    </div>
                    <div>
                        Expected {formatNumber(step.optionalExpected)} from{' '}
                        {step.optionalSlots} optional slots (each adds the
                        chance-weighted answer score of its pool) +{' '}
                        {formatNumber(step.guaranteedSum)} guaranteed.
                    </div>
                    {step.teamBaseStats > 0 && (
                        <div>
                            Boss team base stats average{' '}
                            {Math.round(step.teamBaseStats)} (the ace counts
                            double). An answer score is multiplied by{' '}
                            {BASE_STAT_TIERS.slice(1)
                                .map(
                                    (tier, index) =>
                                        `${formatNumber(tier.factor)}x below ${Math.round(BASE_STAT_TIERS[index].atLeast * 100)}%`,
                                )
                                .join(' and ')}{' '}
                            of that.
                        </div>
                    )}
                    <div className={muted}>
                        Level cap {step.levelCap}. Before this fight:{' '}
                        {step.locationsWalked} encounter slots (
                        {step.guaranteed.length} guaranteed,{' '}
                        {step.optionalSlots} optional), {step.optional.length}{' '}
                        distinct optional Pokémon.
                    </div>
                    {step.slotExpectations.length > 0 && (
                        <div>
                            Optional slots (expected answer score of each):
                            <ul className={stageList}>
                                {step.slotExpectations.map((slot, index) => (
                                    <li key={`${slot.locationName}:${index}`}>
                                        {slot.locationName}:{' '}
                                        {formatNumber(slot.expected)}
                                        <span className={muted}>
                                            {' '}
                                            ({slot.species} possible, best
                                            species {formatNumber(slot.best)})
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </details>
            <details className={disclosure}>
                <summary>Opponent team ({step.members.length})</summary>
                <ul className={speciesList}>
                    {step.members.map((member) => (
                        <MemberEntry key={member.slot} member={member} />
                    ))}
                </ul>
            </details>
            <details className={disclosure}>
                <summary>
                    Your team ({step.locationsWalked} Pokémon so far)
                </summary>
                <div className={details}>
                    <div>
                        You will have <strong>{step.locationsWalked}</strong>{' '}
                        Pokémon at this point:{' '}
                        {step.locationsWalked - step.optionalSlots} guaranteed
                        and {step.optionalSlots} from optional encounters, each
                        one rolling a single species from its pool.{' '}
                        <span className={muted}>
                            Tera Raids and trades are not counted.
                        </span>
                    </div>
                    <strong>Guaranteed: {step.guaranteed.length}</strong>
                    <ul className={speciesList}>
                        {step.guaranteed.map((candidate) => (
                            <TeamEntry
                                key={candidate.form?.name ?? candidate.name}
                                candidate={candidate}
                            />
                        ))}
                    </ul>
                    <strong>Possible encounters: {step.optional.length}</strong>
                    <ul className={speciesList}>
                        {step.optional.map((candidate) => (
                            <TeamEntry
                                key={candidate.form?.name ?? candidate.name}
                                candidate={candidate}
                            />
                        ))}
                    </ul>
                </div>
            </details>
            {groups.map((group) => (
                <details key={group.label} className={disclosure}>
                    <summary>
                        {group.label}: {group.items.length}
                    </summary>
                    <ul className={speciesList}>
                        {group.items.map((candidate) => (
                            <CandidateEntry
                                key={`${candidate.form?.name ?? candidate.name}:${candidate.guaranteed}`}
                                candidate={candidate}
                            />
                        ))}
                    </ul>
                </details>
            ))}
        </li>
    );
}

function MemberEntry({ member }: { member: BossMemberTrace }) {
    const types = formatTypes(member);
    return (
        <li className={memberItem}>
            <div>
                <strong>{member.pokemonName}</strong> Lv {member.level} ({types}
                {member.teraType ? `, Tera ${member.teraType}` : ''}), weight{' '}
                {member.weight}
                {member.note && <span className={muted}> {member.note}</span>}
            </div>
            <div className={muted}>
                Threat types: {member.threatTypes.join(', ') || 'none'}
            </div>
            <ul className={stageList}>
                {member.attacks.map((attack) => (
                    <li
                        key={attack.moveName}
                        className={attack.relevant ? undefined : muted}
                    >
                        {attack.moveName} ({attack.moveType}) {attack.power} x
                        {attack.stab} = {attack.effectivePower}
                        {attack.relevant ? ' threat' : ' ignored'}
                    </li>
                ))}
            </ul>
        </li>
    );
}

/** Says how the encountered Pokémon becomes the form it is fielded as. */
function describeEvolution(candidate: BossCandidate): string | undefined {
    const form = candidate.form;
    // Cosmetic forms such as "Flabébé (Red Flower)" are not evolutions.
    if (
        !form ||
        form.name === candidate.name ||
        form.name.startsWith(`${candidate.name} (`)
    ) {
        return undefined;
    }
    return `evolves from ${candidate.name}${form.requiredLevel > 0 ? ` at level ${form.requiredLevel}` : ''}`;
}

function TeamEntry({ candidate }: { candidate: BossCandidate }) {
    const form = candidate.form;
    const evolution = describeEvolution(candidate);
    const types = form ? formatTypes(form) : '';
    return (
        <li className={speciesItem}>
            <PokemonIcon
                name={form?.name ?? candidate.iconName}
                alt=""
                size="sm"
            />
            <span>
                <strong>{form?.name ?? candidate.name}</strong>
                {types && ` (${types})`}
                {evolution && <span className={muted}> {evolution}</span>}
                <span className={muted}>
                    {' '}
                    at {candidate.locations.join(', ')}
                </span>
            </span>
        </li>
    );
}

function CandidateEntry({ candidate }: { candidate: BossCandidate }) {
    // Several boss Pokémon can share a name, so list each name once.
    const describe = (
        isListed: (matchup: BossMatchupTrace) => boolean,
        describeOne: (matchup: BossMatchupTrace) => string,
    ) => [...new Set(candidate.matchups.filter(isListed).map(describeOne))];
    const describeTrade = (matchup: BossMatchupTrace) =>
        `${matchup.member} (${matchup.bestHitType} hits it ${matchup.bestHitMultiplier}x, its ${matchup.worstType ? `${matchup.worstType} moves` : 'moves'} hit ${matchup.worstMultiplier}x)`;
    const exposed = describe(
        (matchup) => !matchup.holds,
        (matchup) =>
            `${matchup.member} (its ${matchup.worstType} moves hit ${matchup.worstMultiplier}x)`,
    );
    const wins = describe((matchup) => matchup.score > 1, describeTrade);
    const losses = describe(
        (matchup) => matchup.holds && matchup.score < 1,
        describeTrade,
    );
    const form = candidate.form;
    const evolution = describeEvolution(candidate);
    const types = form ? formatTypes(form) : '';
    return (
        <li className={candidateItem}>
            <div className={speciesItem}>
                <PokemonIcon
                    name={form?.name ?? candidate.iconName}
                    alt=""
                    size="sm"
                />
                <span>
                    <strong>{form?.name ?? candidate.name}</strong>
                    {types && ` (${types})`}
                    {candidate.guaranteed ? ' guaranteed' : ''}
                    {candidate.value > candidate.answer &&
                        `, adds ${formatNumber(candidate.value)} (guaranteed wall)`}
                    {candidate.unusableReason &&
                        `: ${candidate.unusableReason}`}
                </span>
            </div>
            <div className={cx(details, muted)}>
                {form && (
                    <div>
                        {evolution &&
                            `Encountered as ${candidate.name}, fielded as ${form.name} (${evolution}). `}
                        Coverage {formatNumber(candidate.coverage)}x, resists
                        every threat from{' '}
                        {Math.round(candidate.wallCoverage * 100)}% of the team
                        {candidate.baseStats > 0 &&
                            `, base stats ${candidate.baseStats}`}
                        {candidate.baseStatFactor < 1 &&
                            ` (${formatNumber(candidate.baseStatFactor)}x)`}
                        , answer score {formatNumber(candidate.answer)}.
                    </div>
                )}
                <div>At {candidate.locations.join(', ')}</div>
                {wins.length > 0 && (
                    <div>Wins the trade against {wins.join(', ')}</div>
                )}
                {losses.length > 0 && (
                    <div>Loses the trade against {losses.join(', ')}</div>
                )}
                {exposed.length > 0 && (
                    <div>Weak against {exposed.join(', ')}</div>
                )}
            </div>
        </li>
    );
}

function formatNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const list = css`
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: 0;
    list-style: none;
`;

const entry = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border-bottom: 0.1rem solid var(--color-border);
    font-size: var(--font-size-sm);

    &:nth-child(even) {
        background: var(--color-surface-alt);
    }
`;

const bossEntry = css`
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: var(--space-2);
        bottom: var(--space-2);
        left: 0;
        width: 0.3rem;
        border-radius: var(--radius-sm);
        background: var(--color-text-muted);
    }
`;

const bossHeader = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
`;

const disclosure = css`
    & > summary {
        cursor: pointer;
        color: var(--color-text-muted);
    }
`;

const details = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-1) 0 var(--space-1) var(--space-3);
`;

const stageList = css`
    margin: 0;
    padding-left: var(--space-4);
`;

const speciesList = css`
    display: flex;
    flex-direction: column;
    margin: 0;
    padding: var(--space-1) 0 var(--space-1) var(--space-3);
    list-style: none;
`;

const speciesItem = css`
    display: flex;
    align-items: center;
    gap: var(--space-2);
`;

const candidateItem = css`
    display: flex;
    flex-direction: column;
`;

const muted = css`
    color: var(--color-text-muted);
`;

/** Banners: a soft tint, the text in its normal color. */
const foldedNotice = css`
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--color-warning-bg);

    & > summary {
        cursor: pointer;
    }

    & > ol {
        margin-top: var(--space-3);
        font-size: var(--font-size-sm);
    }
`;

const allClear = css`
    margin: 0;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    background: var(--color-success-bg);
`;

const icon = css`
    filter: grayscale(1);
`;

const red = css`
    color: var(--color-danger);
`;

const orange = css`
    color: var(--color-warning);
`;

const memberItem = css`
    display: flex;
    flex-direction: column;
    padding-bottom: var(--space-1);
`;
