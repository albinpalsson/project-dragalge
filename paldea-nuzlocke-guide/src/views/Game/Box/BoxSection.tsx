import { css } from '@project-dragalge/css-in-js';
import { MAX_PARTY_SIZE } from '../../../db/game-db/schema';
import type { EncounterRollRow } from '../../../db/game-db/queries';
import type { BoxSectionKind } from './box-model';
import { PokemonBoxIcon, type PokemonBoxIconDragProps } from './PokemonBoxIcon';

type DropZoneProps = Record<'data-box-section-kind', BoxSectionKind>;

interface BoxSectionProps {
    title: string;
    sectionKind: BoxSectionKind;
    rows: EncounterRollRow[];
    emptyText: string;
    selectedLocation: string | undefined;
    draggingLocation: string | undefined;
    isDropTarget: boolean;
    dropDisabledReason: string | undefined;
    dropZoneProps: DropZoneProps;
    getIconDragProps: (row: EncounterRollRow) => PokemonBoxIconDragProps;
    consumeDragClick: (locationName: string) => boolean;
    onSelect: (locationName: string) => void;
}

export function BoxSection({
    title,
    sectionKind,
    rows,
    emptyText,
    selectedLocation,
    draggingLocation,
    isDropTarget,
    dropDisabledReason,
    dropZoneProps,
    getIconDragProps,
    consumeDragClick,
    onSelect,
}: BoxSectionProps) {
    const placeholderCount = Math.max(0, MAX_PARTY_SIZE - rows.length);
    const placeholderKeys =
        sectionKind === 'party'
            ? Array.from(
                  { length: placeholderCount },
                  (_, index) => `party-placeholder-${rows.length + index + 1}`,
              )
            : [];

    return (
        <section
            className={`${section} ${isDropTarget ? sectionDropTarget : ''}`}
            aria-label={title}
            aria-describedby={`${sectionKind}-drop-state`}
            {...dropZoneProps}
        >
            <h4 className={heading}>
                {title} ({rows.length})
            </h4>
            {dropDisabledReason && (
                <span
                    id={`${sectionKind}-drop-state`}
                    className={dropState}
                    role="status"
                >
                    {dropDisabledReason}
                </span>
            )}
            {rows.length === 0 && sectionKind !== 'party' ? (
                <p className={empty}>{emptyText}</p>
            ) : (
                <ul className={list}>
                    {rows.map((row) => (
                        <li key={row.location_name}>
                            <PokemonBoxIcon
                                pokemonName={row.pokemon_name}
                                isSelected={
                                    row.location_name === selectedLocation
                                }
                                isDragging={
                                    row.location_name === draggingLocation
                                }
                                onSelect={() => {
                                    if (consumeDragClick(row.location_name)) {
                                        return;
                                    }
                                    onSelect(row.location_name);
                                }}
                                {...getIconDragProps(row)}
                            />
                        </li>
                    ))}
                    {placeholderKeys.map((placeholderKey) => (
                        <PartySlotPlaceholder key={placeholderKey} />
                    ))}
                </ul>
            )}
        </section>
    );
}

const section = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3) 0;
  border-bottom: 0.1rem solid var(--color-border);

  &:last-child {
    border-bottom: none;
  }
`;

const sectionDropTarget = css`
  && {
    background: var(--color-hover-overlay);
  }
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const list = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1);
  margin: 0;
  padding: 0;
  list-style: none;
`;

const placeholderSlot = css`
    display: grid;
    flex: 0 0 6rem;
    width: 6rem;
    height: 6rem;
    place-items: center;
    color: var(--color-border);
`;

const placeholderBall = css`
    width: 2.8rem;
    height: 2.8rem;
    transform: translateY(0.6rem);
`;

const empty = css`
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const dropState = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;

function PartySlotPlaceholder() {
    return (
        <li className={placeholderSlot} aria-hidden="true">
            <svg
                className={placeholderBall}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                width="32"
                height="32"
                focusable="false"
            >
                <title>Empty party slot</title>
                <circle cx="16" cy="16" r="14" fill="currentColor" />
            </svg>
        </li>
    );
}
