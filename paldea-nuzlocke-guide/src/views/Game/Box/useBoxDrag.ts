import { useRef, useState, type PointerEvent } from 'react';
import type { EncounterRollRow } from '../../../db/game-db/queries';
import type { BoxSectionKind } from './box-model';
import type { PokemonBoxIconDragProps } from './PokemonBoxIcon';

interface BoxDragInput {
    onDropPokemon: (
        locationName: string,
        targetSection: BoxSectionKind,
    ) => Promise<void> | void;
}

interface DragStart {
    locationName: string;
    pokemonName: string;
    pointerId: number;
    startX: number;
    startY: number;
    hasMoved: boolean;
}

interface DragPreview {
    pokemonName: string;
    x: number;
    y: number;
}

const DRAG_THRESHOLD_PX = 6;
const BOX_SECTION_ATTRIBUTE = 'data-box-section-kind';

export function useBoxDrag({ onDropPokemon }: BoxDragInput) {
    const dragStart = useRef<DragStart | null>(null);
    const suppressedClickLocation = useRef<string | null>(null);
    const [draggingLocation, setDraggingLocation] = useState<string>();
    const [dropTarget, setDropTarget] = useState<BoxSectionKind>();
    const [preview, setPreview] = useState<DragPreview>();

    const cleanup = () => {
        dragStart.current = null;
        setDraggingLocation(undefined);
        setDropTarget(undefined);
        setPreview(undefined);
    };

    const targetSectionAt = (
        x: number,
        y: number,
    ): BoxSectionKind | undefined => {
        const element = document
            .elementFromPoint(x, y)
            ?.closest(`[${BOX_SECTION_ATTRIBUTE}]`);
        const kind = element?.getAttribute(BOX_SECTION_ATTRIBUTE);
        if (kind === 'party' || kind === 'box' || kind === 'death') {
            return kind;
        }
        return undefined;
    };

    return {
        draggingLocation,
        dropTarget,
        preview,
        consumeDragClick(locationName: string): boolean {
            if (suppressedClickLocation.current !== locationName) {
                return false;
            }
            suppressedClickLocation.current = null;
            return true;
        },
        getSectionDropProps(sectionKind: BoxSectionKind) {
            return {
                [BOX_SECTION_ATTRIBUTE]: sectionKind,
            };
        },
        getIconDragProps(row: EncounterRollRow): PokemonBoxIconDragProps {
            return {
                onPointerDown(event: PointerEvent<HTMLButtonElement>) {
                    if (event.button !== 0) {
                        return;
                    }
                    event.currentTarget.setPointerCapture(event.pointerId);
                    dragStart.current = {
                        locationName: row.location_name,
                        pokemonName: row.pokemon_name,
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startY: event.clientY,
                        hasMoved: false,
                    };
                },
                onPointerMove(event: PointerEvent<HTMLButtonElement>) {
                    const drag = dragStart.current;
                    if (!drag || drag.pointerId !== event.pointerId) {
                        return;
                    }

                    const distance = Math.hypot(
                        event.clientX - drag.startX,
                        event.clientY - drag.startY,
                    );
                    if (!drag.hasMoved && distance < DRAG_THRESHOLD_PX) {
                        return;
                    }

                    drag.hasMoved = true;
                    setDraggingLocation(drag.locationName);
                    setPreview({
                        pokemonName: drag.pokemonName,
                        x: event.clientX,
                        y: event.clientY,
                    });
                    setDropTarget(
                        targetSectionAt(event.clientX, event.clientY),
                    );
                },
                onPointerUp(event: PointerEvent<HTMLButtonElement>) {
                    const drag = dragStart.current;
                    if (!drag || drag.pointerId !== event.pointerId) {
                        return;
                    }

                    if (drag.hasMoved) {
                        event.preventDefault();
                        suppressedClickLocation.current = drag.locationName;
                        const target = targetSectionAt(
                            event.clientX,
                            event.clientY,
                        );
                        if (target) {
                            void onDropPokemon(drag.locationName, target);
                        }
                    }
                    cleanup();
                },
                onPointerCancel() {
                    cleanup();
                },
            };
        },
    };
}
