import { useState } from 'react';
import { css, cx } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import { OverflowMenu } from '../../components/OverflowMenu';
import {
    NO_PARTY_SLOT,
} from '../../db/game-db/schema';
import type { EncounterRollRow, GameRunRow } from '../../db/game-db/queries';
import { pokemonIconSrc, toIconSlug } from '../../pokemon-icon';
import { getRandomizerDisplayName } from '../../randomizer-groups';
import { ExportGameModal } from './ExportGameModal';

interface GameCardProps {
    game: GameRunRow;
    obtained: EncounterRollRow[];
    isLost: boolean;
    onOpenGame: () => void;
}

  export function GameCard({ game, obtained, isLost, onOpenGame }: GameCardProps) {
    const [isExportOpen, setExportOpen] = useState(false);
    const sorted = partyFirst(obtained);
    const progress = Math.min(sorted.length * 8, 100);
    const variantColor =
        game.variant === 'v' ? 'var(--color-accent)' : 'var(--color-primary)';

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
              <span className={name}>{game.name}</span>
              {isLost && <span className={lostBadge}>Run Lost</span>}
              <span className={progressLabel}>{sorted.length} caught</span>
              {sorted.length > 0 ? (
                <span className={icons}>
                  {sorted.slice(0, 6).map((row, index, shown) => (
                    <span className={iconSlot} key={row.location_name}>
                      {index > 0 &&
                        shown[index - 1].party_slot !== NO_PARTY_SLOT &&
                        row.party_slot === NO_PARTY_SLOT && (
                          <span className={divider} />
                        )}
                      <img
                        className={icon}
                        src={pokemonIconSrc(
                          toIconSlug(row.pokemon_name),
                        )}
                        alt={getRandomizerDisplayName(row.pokemon_name)}
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
              <Button variant="secondary" onClick={() => setExportOpen(true)}>
                Export game
              </Button>
            </OverflowMenu>
          </div>
          {isExportOpen && (
            <ExportGameModal
              gameRunId={game.id}
              onClose={() => setExportOpen(false)}
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
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
`;
const card = css`
  position: relative;
  overflow: hidden;
  width: 36rem;
  aspect-ratio: 3 / 2;
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
`;

const name = css`
  position: absolute;
  top: var(--space-2);
  left: var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  max-width: calc(50% - var(--space-2));
  overflow-wrap: anywhere;
`;

const lostBadge = css`
  position: absolute;
  top: var(--space-2);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.75rem;
  border-radius: 0.25rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-danger);
  background-color: var(--color-danger-bg);
`;

const progressLabel = css`
  position: absolute;
  top: var(--space-2);
  right: calc(3.6rem + var(--space-4));
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const icons = css`
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: var(--space-1);
`;

const iconSlot = css`
  display: flex;
  align-items: center;
  gap: var(--space-1);
`;

const divider = css`
  width: 0.1rem;
  height: 4rem;
  background: var(--color-border);
`;

const icon = css`
  width: 5.6rem;
  height: 5.6rem;
`;

const emptyText = css`
  position: absolute;
  right: var(--space-2);
  bottom: var(--space-2);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const menuSlot = css`
  position: absolute;
  top: var(--space-2);
  right: var(--space-2);
`;
