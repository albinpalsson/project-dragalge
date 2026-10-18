import { useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { pokemonIconSrc, toIconSlug } from '../../../pokemon-icon';
import { usePartyManager } from '../../../hooks/usePartyManager';
import { useGame } from '../GameContext';
import {
    canDropPokemon,
    deriveBoxSections,
    type BoxSectionKind,
} from './box-model';
import { BoxSection } from './BoxSection';
import { PokemonDetailPane } from './PokemonDetailPane';
import { useBoxDrag } from './useBoxDrag';

export function BoxContents() {
    const game = useGame();
    const [selectedLocation, setSelectedLocation] = useState<string>();
    const { party, stored, eliminated } = deriveBoxSections(game.encounters);
    const partyManager = usePartyManager();

    const selected = game.encounters.find(
        (row) => row.location_name === selectedLocation,
    );

    const drag = useBoxDrag({
        async onDropPokemon(locationName, targetSection) {
            const row = game.encounters.find(
                (entry) => entry.location_name === locationName,
            );
            if (!row) {
                return;
            }
            const result = canDropPokemon({ row, targetSection, party });
            if (!result.allowed) {
                setSelectedLocation(locationName);
                return;
            }
            await partyManager.moveToSection(locationName, targetSection);
        },
    });
    const dragged = game.encounters.find(
        (row) => row.location_name === drag.draggingLocation,
    );

    const select = (locationName: string) => {
        setSelectedLocation(
            locationName === selectedLocation ? undefined : locationName,
        );
    };

    const dropDisabledReason = (targetSection: BoxSectionKind) => {
        if (!dragged) {
            return undefined;
        }
        return canDropPokemon({
            row: dragged,
            targetSection,
            party,
        }).reason;
    };

    return (
        <div className={contents}>
            <div className={sections}>
                <BoxSection
                    title="Party"
                    sectionKind="party"
                    rows={party}
                    emptyText="No Pokémon in the party."
                    selectedLocation={selectedLocation}
                    draggingLocation={drag.draggingLocation}
                    isDropTarget={drag.dropTarget === 'party'}
                    dropDisabledReason={dropDisabledReason('party')}
                    dropZoneProps={drag.getSectionDropProps('party')}
                    getIconDragProps={drag.getIconDragProps}
                    consumeDragClick={drag.consumeDragClick}
                    onSelect={select}
                />
                <BoxSection
                    title="Box"
                    sectionKind="box"
                    rows={stored}
                    emptyText="No stored Pokémon."
                    selectedLocation={selectedLocation}
                    draggingLocation={drag.draggingLocation}
                    isDropTarget={drag.dropTarget === 'box'}
                    dropDisabledReason={dropDisabledReason('box')}
                    dropZoneProps={drag.getSectionDropProps('box')}
                    getIconDragProps={drag.getIconDragProps}
                    consumeDragClick={drag.consumeDragClick}
                    onSelect={select}
                />
                <BoxSection
                    title="Death Box"
                    sectionKind="death"
                    rows={eliminated}
                    emptyText="No fallen Pokémon."
                    selectedLocation={selectedLocation}
                    draggingLocation={drag.draggingLocation}
                    isDropTarget={drag.dropTarget === 'death'}
                    dropDisabledReason={dropDisabledReason('death')}
                    dropZoneProps={drag.getSectionDropProps('death')}
                    getIconDragProps={drag.getIconDragProps}
                    consumeDragClick={drag.consumeDragClick}
                    onSelect={select}
                />
            </div>
            {selected && (
                <PokemonDetailPane
                    key={selected.location_name}
                    row={selected}
                    party={party}
                />
            )}
            {drag.preview && (
                <img
                    className={dragPreview}
                    src={pokemonIconSrc(toIconSlug(drag.preview.pokemonName))}
                    alt=""
                    style={{
                        left: drag.preview.x,
                        top: drag.preview.y,
                    }}
                />
            )}
        </div>
    );
}

const contents = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const sections = css`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const dragPreview = css`
    position: fixed;
    z-index: 1200;
    width: 5.6rem;
    height: 5.6rem;
    pointer-events: none;
    transform: translate(-50%, -50%);
    filter: drop-shadow(0 0.4rem 1rem rgba(0, 0, 0, 0.35));
`;
