import { css } from '@project-dragalge/css-in-js';
import { useState } from 'react';
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
    // Keep the canonical start stable for this visit as settings change visibility.
    const [startIndex] = useState(() =>
        calculateProgressionStart(
            visibleItems,
            progression.nextKey,
            progression.firstUnresolvedKey,
        ),
    );
    const [showPrevious, setShowPrevious] = useState(false);
    const { previousItems, currentItems } = partitionProgressionItems(
        visibleItems,
        startIndex,
    );
    const itemsToRender = showPrevious
        ? [...previousItems, ...currentItems]
        : currentItems;

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
        </>
    );
}

function partitionProgressionItems(
    visibleItems: IndexedProgressionItem[],
    startIndex: number | undefined,
): {
    previousItems: ProgressionItem[];
    currentItems: ProgressionItem[];
} {
    const previousItems: ProgressionItem[] = [];
    const currentItems: ProgressionItem[] = [];

    if (startIndex === undefined) {
        return { previousItems, currentItems };
    }

    for (const { item, canonicalIndex } of visibleItems) {
        if (canonicalIndex < startIndex) {
            previousItems.push(item);
        } else {
            currentItems.push(item);
        }
    }

    return { previousItems, currentItems };
}

const ITEMS_BEFORE_NEXT_STEP = 2;

interface IndexedProgressionItem {
    item: ProgressionItem;
    canonicalIndex: number;
}

function indexProgressionItems(
    visibleItems: ProgressionItem[],
): IndexedProgressionItem[] {
    return visibleItems.map((item) => ({
        item,
        canonicalIndex: PROGRESSION_ITEMS.indexOf(item),
    }));
}

function calculateProgressionStart(
    visibleItems: IndexedProgressionItem[],
    nextKey: string | undefined,
    firstUnresolvedKey: string | undefined,
): number | undefined {
    if (visibleItems.length === 0) {
        return undefined;
    }

    const matchedNextIndex = visibleItems.findIndex(
        ({ item }) => item.key === nextKey,
    );
    const nextIndex =
        matchedNextIndex < 0 ? visibleItems.length : matchedNextIndex;
    const firstUnresolvedIndex = visibleItems.findIndex(
        ({ item }) => item.key === firstUnresolvedKey,
    );
    const startVisibleIndex = Math.max(
        0,
        (firstUnresolvedIndex < 0 ? nextIndex : firstUnresolvedIndex) -
            ITEMS_BEFORE_NEXT_STEP,
    );

    return visibleItems[startVisibleIndex].canonicalIndex;
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
