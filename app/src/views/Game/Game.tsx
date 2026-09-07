import { css, cx } from '@pokedb2/css-in-js';
import type { EncounterRollRow } from '../../db/game-db/schema';
import { type RandomizerMode, toRandomizerMode } from '../../randomizer';
import { useEncounterRollsQuery, useGameRunQuery } from './queries';
import { EncounterCard } from './EncounterCard';
import {
    PROGRESSION,
    type BossType,
    type ProgressionEntry,
} from './progression';
import { StarterCard } from './StarterCard';

interface GameProps {
    gameRunId: string;
}

export function Game({ gameRunId }: GameProps) {
    const gameRun = useGameRunQuery(gameRunId);
    const rolls = useEncounterRollsQuery(gameRunId);
    const randomizerMode = toRandomizerMode(
        gameRun.data?.randomizer_mode ?? '',
    );

    return (
        <section>
            <h2>{gameRunId}</h2>
            {rolls.isPending && <p className={mutedText}>Loading...</p>}
            {rolls.isError && (
                <p className={mutedText}>
                    Error loading encounters. {String(rolls.error)}
                </p>
            )}
            {rolls.isSuccess && (
                <ol className={cardList}>
                    {PROGRESSION.map((entry) => (
                        <li key={entry.id}>
                            {renderProgressionEntry(
                                entry,
                                gameRunId,
                                rolls.data ?? [],
                                randomizerMode,
                            )}
                        </li>
                    ))}
                </ol>
            )}
        </section>
    );
}

function renderProgressionEntry(
    entry: ProgressionEntry,
    gameRunId: string,
    rolls: EncounterRollRow[],
    randomizerMode: RandomizerMode,
) {
    if (entry.type === 'starter') {
        return <StarterCard gameRunId={gameRunId} rolls={rolls} />;
    }
    if (entry.type === 'encounter' && entry.isImplemented) {
        return (
            <EncounterCard
                gameRunId={gameRunId}
                locationName={entry.name}
                rolls={rolls}
                randomizerMode={randomizerMode}
            />
        );
    }
    if (entry.type === 'encounter') {
        return <EncounterSummaryRow entry={entry} />;
    }
    return <BossSummaryRow entry={entry} />;
}

function EncounterSummaryRow({
    entry,
}: {
    entry: Extract<ProgressionEntry, { type: 'encounter' }>;
}) {
    return (
        <article className={summaryRow}>
            <div>
                <h3 className={summaryHeading}>{entry.name}</h3>
                <p className={summaryMeta}>{entry.province}</p>
            </div>
            <span className={summaryBadge}>Encounter card coming later</span>
        </article>
    );
}

function BossSummaryRow({
    entry,
}: {
    entry: Extract<ProgressionEntry, { type: 'boss' }>;
}) {
    return (
        <article className={cx(summaryRow, bossClass(entry.bossType))}>
            <div>
                <h3 className={summaryHeading}>{entry.name}</h3>
                <p className={summaryMeta}>{entry.location}</p>
            </div>
            <span className={summaryBadge}>Lv {entry.levelCap}</span>
        </article>
    );
}

function bossClass(type: BossType): string {
    return {
        rival: bossRival,
        gym: bossGym,
        titan: bossTitan,
        starfall: bossStarfall,
        elite4: bossElite4,
    }[type];
}

const cardList = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const mutedText = css`
  color: var(--color-text-muted);
`;

const summaryRow = css`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface);
    border: 0.1rem solid var(--color-border);
    border-left: 0.4rem solid var(--color-border);
    border-radius: var(--radius-md);
`;

const summaryHeading = css`
    margin: 0;
    font-size: var(--font-size-base);
`;

const summaryMeta = css`
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const summaryBadge = css`
    flex-shrink: 0;
    padding: var(--space-1) var(--space-2);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const bossRival = css`
    border-left-color: #4a9e78;
`;

const bossGym = css`
    border-left-color: #767f9e;
`;

const bossTitan = css`
    border-left-color: #b07838;
`;

const bossStarfall = css`
    border-left-color: #9958b8;
`;

const bossElite4 = css`
    border-left-color: var(--color-primary);
`;
