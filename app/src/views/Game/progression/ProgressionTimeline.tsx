import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { useProgressionTracker } from '../../../hooks/useProgressionTracker';
import { useGame } from '../GameContext';
import {
    getVisibleProgressionItems,
    PROGRESSION_ITEMS,
    type ProgressionItem,
} from './progression-items';

export function ProgressionTimeline() {
    const game = useGame();
    const progression = useProgressionTracker();
    const visibleItems = indexProgressionItems(
        getVisibleProgressionItems({
            settings: game.settings,
            encounters: game.encounters,
        }),
    );
    // Keep canonical bounds stable for this visit as settings change visibility.
    const [windowBounds] = useState(() =>
        calculateProgressionWindow(visibleItems, progression.nextKey),
    );
    const [showPrevious, setShowPrevious] = useState(false);
    const [showMore, setShowMore] = useState(false);
    const { previousItems, windowItems, futureItems } = partitionProgressionItems(
        visibleItems,
        windowBounds,
    );
    const itemsToRender = [
        ...(showPrevious ? previousItems : []),
        ...windowItems,
        ...(showMore ? futureItems : []),
    ];

    return (
        <>
            {previousItems.length > 0 && !showPrevious && (
                <button
                    type="button"
                    className={progressionReveal}
                    onClick={() => setShowPrevious(true)}
                >
                    <span>Show previous steps</span>
                </button>
            )}
            <ol className={cardList}>
                {itemsToRender.map((item) => (
                    <li key={item.key} className={cardItem}>
                        {progression.nextKey === item.key && (
                            <p className={nextStepLabel}>→ Next step</p>
                        )}
                        <item.Component
                            isNext={progression.nextKey === item.key}
                        />
                    </li>
                ))}
            </ol>
            {futureItems.length > 0 && !showMore && (
                <button
                    type="button"
                    className={progressionReveal}
                    onClick={() => setShowMore(true)}
                >
                    <span>Show more</span>
                </button>
            )}
        </>
    );
}

function partitionProgressionItems(
    visibleItems: IndexedProgressionItem[],
    windowBounds: ProgressionWindowBounds,
): {
    previousItems: ProgressionItem[];
    windowItems: ProgressionItem[];
    futureItems: ProgressionItem[];
} {
    const previousItems: ProgressionItem[] = [];
    const windowItems: ProgressionItem[] = [];
    const futureItems: ProgressionItem[] = [];

    if (
        windowBounds.startIndex === undefined ||
        windowBounds.endIndex === undefined
    ) {
        return { previousItems, windowItems, futureItems };
    }

    for (const { item, canonicalIndex } of visibleItems) {
        if (canonicalIndex < windowBounds.startIndex) {
            previousItems.push(item);
        } else if (canonicalIndex <= windowBounds.endIndex) {
            windowItems.push(item);
        } else {
            futureItems.push(item);
        }
    }

    return { previousItems, windowItems, futureItems };
}

const ITEMS_BEFORE_NEXT_STEP = 2;
const MINIMUM_WINDOW_SIZE = 4;

interface IndexedProgressionItem {
    item: ProgressionItem;
    canonicalIndex: number;
}

interface ProgressionWindowBounds {
    startIndex: number | undefined;
    endIndex: number | undefined;
}

function indexProgressionItems(
    visibleItems: ProgressionItem[],
): IndexedProgressionItem[] {
    return visibleItems.map((item) => ({
        item,
        canonicalIndex: PROGRESSION_ITEMS.indexOf(item),
    }));
}

function calculateProgressionWindow(
    visibleItems: IndexedProgressionItem[],
    nextKey: string | undefined,
): ProgressionWindowBounds {
    if (visibleItems.length === 0) {
        return { startIndex: undefined, endIndex: undefined };
    }

    const matchedNextIndex = visibleItems.findIndex(
        ({ item }) => item.key === nextKey,
    );
    const nextIndex = matchedNextIndex < 0 ? visibleItems.length : matchedNextIndex;
    const startVisibleIndex = Math.max(
        0,
        nextIndex - ITEMS_BEFORE_NEXT_STEP,
    );
    const checkpointIndices: number[] = [];

    for (
        let index = nextIndex;
        index < visibleItems.length && checkpointIndices.length < 2;
        index += 1
    ) {
        if (visibleItems[index].item.checkpointAfter) {
            checkpointIndices.push(index);
        }
    }

    const [firstCheckpointIndex, secondCheckpointIndex] = checkpointIndices;
    const lastVisibleIndex = visibleItems.length - 1;
    const endVisibleIndex =
        firstCheckpointIndex === undefined
            ? lastVisibleIndex
            : firstCheckpointIndex - nextIndex + 1 >= MINIMUM_WINDOW_SIZE
              ? firstCheckpointIndex
              : (secondCheckpointIndex ?? lastVisibleIndex);

    return {
        startIndex: visibleItems[startVisibleIndex].canonicalIndex,
        endIndex: visibleItems[endVisibleIndex].canonicalIndex,
    };
}

const cardList = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    list-style: none;
    width: 100%;
    min-width: 0;
    margin: 0;
    padding: 0;
`;

const cardItem = css`
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: 100%;
    min-width: 0;

    > * {
        width: 100%;
        min-width: 0;
    }
`;

const nextStepLabel = css`
    margin: 0;
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
`;

const progressionReveal = css`
    display: flex;
    align-items: center;
    gap: var(--space-2);
    width: 100%;
    min-width: 0;
    min-height: 2.75rem;
    padding: var(--space-2) 0;
    border: 0;
    background: transparent;
    color: var(--color-text-muted);
    font: inherit;
    cursor: pointer;

    &::before,
    &::after {
        content: '';
        flex: 1;
        min-width: 0;
        border-top: 0.1rem solid var(--color-border);
    }

    > span {
        flex: 0 0 auto;
        white-space: nowrap;
    }

    &:hover {
        color: var(--color-primary);
    }

    &:focus-visible {
        border-radius: var(--radius-sm);
        outline: 0.2rem solid var(--color-primary);
        outline-offset: 0.2rem;
    }
`;