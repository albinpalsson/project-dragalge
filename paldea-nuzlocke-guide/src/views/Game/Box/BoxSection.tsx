import { css } from '@project-dragalge/css-in-js';
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
            {rows.length === 0 ? (
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

const empty = css`
  margin: 0;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const dropState = css`
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
`;
