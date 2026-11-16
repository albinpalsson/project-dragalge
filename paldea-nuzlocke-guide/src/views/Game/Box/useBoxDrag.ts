import { useRef, useState, type PointerEvent } from 'react';
import type { EncounterRollRow } from '../../../db/game-db/queries';
import { hapticTick } from '../../../utils/haptics';
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
    isTouch: boolean;
    isArmed: boolean;
}

interface DragPreview {
    pokemonName: string;
    x: number;
    y: number;
}

const DRAG_THRESHOLD_PX = 6;
// Fingers wobble more than mice; don't cancel a pending long press for that.
const TOUCH_SLOP_PX = 10;
const LONG_PRESS_MS = 250;
const PRESSING_ATTRIBUTE = 'data-pressing';
const BOX_SECTION_ATTRIBUTE = 'data-box-section-kind';

// Module-level so the same reference is removed after re-renders.
function blockTouchScroll(event: TouchEvent) {
    event.preventDefault();
}

export function useBoxDrag({ onDropPokemon }: BoxDragInput) {
    const dragStart = useRef<DragStart | null>(null);
    const suppressedClickLocation = useRef<string | null>(null);
    const [draggingLocation, setDraggingLocation] = useState<string>();
    const [dropTarget, setDropTarget] = useState<BoxSectionKind>();
    const [preview, setPreview] = useState<DragPreview>();

    const longPressTimer = useRef<number | undefined>(undefined);
    const pressedElement = useRef<HTMLElement | null>(null);

    const clearPressing = () => {
        pressedElement.current?.removeAttribute(PRESSING_ATTRIBUTE);
        pressedElement.current = null;
    };

    const cleanup = () => {
        window.clearTimeout(longPressTimer.current);
        clearPressing();
        window.removeEventListener('touchmove', blockTouchScroll);
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
                    const target = event.currentTarget;
                    const isTouch = event.pointerType === 'touch';
                    const drag: DragStart = {
                        locationName: row.location_name,
                        pokemonName: row.pokemon_name,
                        pointerId: event.pointerId,
                        startX: event.clientX,
                        startY: event.clientY,
                        hasMoved: false,
                        isTouch,
                        isArmed: !isTouch,
                    };
                    dragStart.current = drag;

                    if (!isTouch) {
                        target.setPointerCapture(event.pointerId);
                        return;
                    }

                    // Touch needs a long press so swiping over icons still scrolls.
                    // Show press feedback straight away (via the DOM, no re-render).
                    target.setAttribute(PRESSING_ATTRIBUTE, '');
                    pressedElement.current = target;
                    longPressTimer.current = window.setTimeout(() => {
                        if (dragStart.current !== drag) {
                            return;
                        }
                        clearPressing();
                        drag.isArmed = true;
                        target.setPointerCapture(drag.pointerId);
                        window.addEventListener(
                            'touchmove',
                            blockTouchScroll,
                            { passive: false },
                        );
                        hapticTick();
                        setDraggingLocation(drag.locationName);
                        setPreview({
                            pokemonName: drag.pokemonName,
                            x: drag.startX,
                            y: drag.startY,
                        });
                    }, LONG_PRESS_MS);
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
                    const threshold =
                        drag.isTouch && !drag.isArmed
                            ? TOUCH_SLOP_PX
                            : DRAG_THRESHOLD_PX;
                    if (!drag.hasMoved && distance < threshold) {
                        return;
                    }
                    if (!drag.isArmed) {
                        // Moved before the long press fired: let the page scroll.
                        cleanup();
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
