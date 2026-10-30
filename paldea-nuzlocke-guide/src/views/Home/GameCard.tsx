import { useState } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';
import { OverflowMenu, OverflowMenuItem } from '../../components/OverflowMenu';
import { NO_PARTY_SLOT } from '../../db/game-db/schema';
import type {
    EncounterRollRow,
    GameRun,
    GameStatus,
} from '../../db/game-db/queries';
import { pokemonIconSrc, toIconSlug } from '../../pokemon-icon';
import { formatCreatedDate } from '../../utils/format-date';
import { DeleteGameModal } from './DeleteGameModal';
import { ExportGameModal } from './ExportGameModal';
import { RenameGameModal } from './RenameGameModal';
import { SetGameStatusModal } from './SetGameStatusModal';

interface GameCardProps {
    game: GameRun;
    obtained: EncounterRollRow[];
    status: GameStatus;
    progressPercent: number;
    onOpenGame: () => void;
}

export function GameCard({
    game,
    obtained,
    status,
    progressPercent,
    onOpenGame,
}: GameCardProps) {
    const [isRenameOpen, setRenameOpen] = useState(false);
    const [isStatusOpen, setStatusOpen] = useState(false);
    const [isExportOpen, setExportOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const displayed = selectSummaryPokemon(obtained, status);
    const hasPokemon = displayed.some((row) => row !== undefined);
    const isLost = status === 'lost';
    const isWon = status === 'won';
    const statusColor =
        status === 'lost'
            ? 'var(--color-game-scarlet)'
            : status === 'won'
              ? 'var(--color-success)'
              : 'var(--color-primary)';

    return (
        <div className={container}>
            <button type="button" className={cardButton} onClick={onOpenGame}>
                <div className={cx(card, isLost && lostCard)}>
                    <div className={track} aria-hidden="true">
                        <div
                            className={fill}
                            style={{
                                width: `${progressPercent}%`,
                                backgroundImage: `repeating-linear-gradient(45deg, color-mix(in srgb, ${statusColor} 80%, transparent), color-mix(in srgb, ${statusColor} 80%, transparent) 0.6rem, color-mix(in srgb, ${statusColor} 50%, transparent) 0.6rem, color-mix(in srgb, ${statusColor} 50%, transparent) 1.2rem)`,
                            }}
                        />
                    </div>
                    <span className={header}>
                        <span className={heading}>
                            <span className={name}>{game.name}</span>
                            <span className={meta}>
                                <span className={createdDate}>
                                    Started {formatCreatedDate(game.createdAt)}
                                </span>
                                <span aria-hidden="true">|</span>
                                <span>{progressPercent}%</span>
                            </span>
                        </span>
                        {isLost && <span className={lostBadge}>Run Lost</span>}
                        {isWon && (
                            <span className={wonBadge}>Run Complete</span>
                        )}
                    </span>
                    {(isWon || hasPokemon) && (
                        <span className={cx(icons, isWon && partyIcons)}>
                            {displayed.map((row, index) => (
                                <span
                                    className={iconSlot}
                                    key={
                                        row?.location_name ??
                                        `party-${index + 1}`
                                    }
                                    aria-hidden={row ? undefined : true}
                                >
                                    {row && (
                                        <img
                                            className={cx(
                                                icon,
                                                row.status === 'eliminated' &&
                                                    eliminatedIcon,
                                            )}
                                            src={pokemonIconSrc(
                                                toIconSlug(row.pokemon_name),
                                            )}
                                            alt={row.pokemon_name}
                                            loading="lazy"
                                        />
                                    )}
                                </span>
                            ))}
                        </span>
                    )}
                    {!hasPokemon && (
                        <span className={emptyText}>
                            {isWon ? 'No party Pokémon' : 'No caught Pokémon'}
                        </span>
                    )}
                </div>
            </button>
            <div className={menuSlot}>
                <OverflowMenu label="Game options">
                    <OverflowMenuItem onClick={() => setRenameOpen(true)}>
                        Edit name
                    </OverflowMenuItem>
                    <OverflowMenuItem onClick={() => setStatusOpen(true)}>
                        Mark won/lost
                    </OverflowMenuItem>
                    <OverflowMenuItem onClick={() => setExportOpen(true)}>
                        Export game
                    </OverflowMenuItem>
                    <OverflowMenuItem onClick={() => setDeleteOpen(true)}>
                        Delete game
                    </OverflowMenuItem>
                </OverflowMenu>
            </div>
            {isRenameOpen && (
                <RenameGameModal
                    gameName={game.name}
                    onClose={() => setRenameOpen(false)}
                />
            )}
            {isStatusOpen && (
                <SetGameStatusModal
                    gameName={game.name}
                    status={status}
                    onClose={() => setStatusOpen(false)}
                />
            )}
            {isExportOpen && (
                <ExportGameModal
                    gameName={game.name}
                    onClose={() => setExportOpen(false)}
                />
            )}
            {isDeleteOpen && (
                <DeleteGameModal
                    gameName={game.name}
                    onClose={() => setDeleteOpen(false)}
                />
            )}
        </div>
    );
}

function selectSummaryPokemon(
    rows: EncounterRollRow[],
    status: GameCardProps['status'],
): (EncounterRollRow | undefined)[] {
    const living = rows.filter((row) => row.status === 'caught');
    const party = living
        .filter((row) => row.party_slot !== NO_PARTY_SLOT)
        .sort((first, second) => first.party_slot - second.party_slot);
    if (status === 'won') {
        return Array.from({ length: 6 }, (_, index) =>
            party.find((row) => row.party_slot === index + 1),
        );
    }
    const boxed = living.filter((row) => row.party_slot === NO_PARTY_SLOT);
    const eliminated = rows.filter((row) => row.status === 'eliminated');
    return [...party, ...boxed, ...eliminated].slice(0, 18).reverse();
}
const container = css`
  position: relative;
`;

const cardButton = css`
  display: block;
    width: 100%;
    max-width: 36rem;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`;
const card = css`
  position: relative;
  overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    width: 100%;
    min-height: 24rem;
    padding: var(--space-2);
    padding-bottom: calc(var(--space-2) + 1.4rem);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const lostCard = css`
  opacity: 0.6;
`;

const track = css`
  position: absolute;
  inset: auto 0 0 0;
  height: 0.6rem;
  background: var(--color-border);
`;

const fill = css`
  height: 100%;
`;

const header = css`
    position: relative;
    z-index: 1;
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    padding-right: 4rem;
        direction: ltr;
`;

const heading = css`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-width: 0;
`;

const meta = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    font-size: var(--font-size-xs);
    color: var(--color-text-muted);
    text-align: left;
`;

const createdDate = css`
    white-space: nowrap;
`;

const name = css`
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-muted);
    min-width: 0;
        text-align: left;
  overflow-wrap: anywhere;
`;

const lostBadge = css`
    flex: 0 0 auto;
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-danger);
  background-color: var(--color-danger-bg);
`;

const wonBadge = css`
    flex: 0 0 auto;
    padding: 0.25rem 0.75rem;
    border-radius: 0.25rem;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-success);
    background-color: var(--color-success-bg);
`;

const icons = css`
    position: relative;
    z-index: 1;
    display: flex;
    flex-flow: row-reverse wrap-reverse;
    align-items: center;
    align-self: center;
    width: min(100%, 34rem);
    margin-top: auto;
    gap: var(--space-1);
`;

const partyIcons = css`
    display: grid;
    direction: rtl;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    grid-template-rows: repeat(2, minmax(0, 1fr));
    width: min(100%, 17rem);
    margin-bottom: auto;
`;

const iconSlot = css`
    display: grid;
    place-items: center;
    min-width: 0;
    flex: 0 0 calc((100% - 5 * var(--space-1)) / 6);
    aspect-ratio: 1;
    direction: ltr;
`;

const icon = css`
    display: block;
    width: 100%;
    max-width: 5.2rem;
    aspect-ratio: 1;
    object-fit: contain;
`;

const eliminatedIcon = css`
    filter: grayscale(1);
`;

const emptyText = css`
    position: relative;
    z-index: 1;
    align-self: flex-end;
    margin-top: auto;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const menuSlot = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
    z-index: 2;
`;
