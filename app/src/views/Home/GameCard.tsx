import { useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { OverflowMenu, OverflowMenuItem } from '../../components/OverflowMenu';
import { NO_PARTY_SLOT } from '../../db/game-db/schema';
import type { EncounterRollRow, GameRun } from '../../db/game-db/queries';
import { pokemonIconSrc, toIconSlug } from '../../pokemon-icon';
import { DeleteGameModal } from './DeleteGameModal';
import { ExportGameModal } from './ExportGameModal';

interface GameCardProps {
    game: GameRun;
    obtained: EncounterRollRow[];
    isLost: boolean;
    onOpenGame: () => void;
}

export function GameCard({
    game,
    obtained,
    isLost,
    onOpenGame,
}: GameCardProps) {
    const [isExportOpen, setExportOpen] = useState(false);
    const [isDeleteOpen, setDeleteOpen] = useState(false);
    const sorted = partyFirst(obtained);
    const progress = Math.min(sorted.length * 8, 100);
    const variantColor =
        game.variant === 'v'
            ? 'var(--color-game-violet)'
            : 'var(--color-game-scarlet)';

    return (
        <div className={container}>
            <button type="button" className={cardButton} onClick={onOpenGame}>
                <div className={cx(card, isLost && lostCard)}>
                    <div
                        className={fill}
                        style={{
                            width: `${progress}%`,
                            backgroundImage: `repeating-linear-gradient(45deg, color-mix(in srgb, ${variantColor} 35%, transparent), color-mix(in srgb, ${variantColor} 35%, transparent) 0.6rem, color-mix(in srgb, ${variantColor} 20%, transparent) 0.6rem, color-mix(in srgb, ${variantColor} 20%, transparent) 1.2rem)`,
                        }}
                    />
                    <span className={header}>
                        <span className={name}>{game.name}</span>
                        {isLost && <span className={lostBadge}>Run Lost</span>}
                    </span>
                    {sorted.length > 0 ? (
                        <span className={icons}>
                            {sorted.slice(0, 15).map((row) => (
                                <span
                                    className={iconSlot}
                                    key={row.location_name}
                                >
                                    <img
                                        className={icon}
                                        src={pokemonIconSrc(
                                            toIconSlug(row.pokemon_name),
                                        )}
                                        alt={row.pokemon_name}
                                        loading="lazy"
                                    />
                                </span>
                            ))}
                        </span>
                    ) : (
                        <span className={emptyText}>No caught Pokémon</span>
                    )}
                </div>
            </button>
            <div className={menuSlot}>
                <OverflowMenu label="Game options">
                    <OverflowMenuItem onClick={() => setExportOpen(true)}>
                        Export game
                    </OverflowMenuItem>
                    <OverflowMenuItem onClick={() => setDeleteOpen(true)}>
                        Delete game
                    </OverflowMenuItem>
                </OverflowMenu>
            </div>
            {isExportOpen && (
                <ExportGameModal
                    gameRunId={game.id}
                    onClose={() => setExportOpen(false)}
                />
            )}
            {isDeleteOpen && (
                <DeleteGameModal
                    gameRunId={game.id}
                    gameName={game.name}
                    onClose={() => setDeleteOpen(false)}
                />
            )}
        </div>
    );
}

function partyFirst(rows: EncounterRollRow[]) {
    const party = rows
        .filter((row) => row.party_slot !== NO_PARTY_SLOT)
        .sort((a, b) => a.party_slot - b.party_slot);
    const rest = rows.filter((row) => row.party_slot === NO_PARTY_SLOT);
    return [...party, ...rest];
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
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const lostCard = css`
  opacity: 0.6;
  border-color: var(--color-danger);
`;

const fill = css`
  position: absolute;
  inset: 0 auto 0 0;
    z-index: 0;
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

const name = css`
    flex: 1;
  font-size: var(--font-size-sm);
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

const icons = css`
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    align-items: center;
        align-self: center;
    width: min(100%, 29.6rem);
    margin-top: auto;
        direction: rtl;
  gap: var(--space-1);
`;

const iconSlot = css`
    display: grid;
    place-items: center;
    min-width: 0;
    aspect-ratio: 1;
        direction: ltr;
`;

const icon = css`
    display: block;
    width: 100%;
    max-width: 5.6rem;
    aspect-ratio: 1;
    object-fit: contain;
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
