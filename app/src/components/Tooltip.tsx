import { css, cx } from '@pokedb2/css-in-js';
import {
    cloneElement,
    isValidElement,
    useEffect,
    useRef,
    useState,
    type FocusEventHandler,
    type MouseEventHandler,
    type ReactElement,
    type ReactNode,
} from 'react';

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    className?: string;
    bubbleClassName?: string;
}

export function Tooltip({
    content,
    children,
    className,
    bubbleClassName,
}: TooltipProps) {
    const rootRef = useRef<HTMLSpanElement>(null);
    const [isHovered, setHovered] = useState(false);
    const [isFocused, setFocused] = useState(false);
    const [isPinned, setPinned] = useState(false);

    const hasContent =
        typeof content === 'string'
            ? content.trim().length > 0
            : Boolean(content);
    const isOpen = hasContent && (isHovered || isFocused || isPinned);

    useEffect(() => {
        const onPointerDown = (event: globalThis.MouseEvent) => {
            const target = event.target;
            const isInside =
                target instanceof Node &&
                rootRef.current &&
                rootRef.current.contains(target);

            if (isInside) {
                const trigger = target as HTMLElement;
                if (trigger.closest('button, a')) {
                    setPinned((value) => !value);
                }
                return;
            }

            if (!isPinned) {
                return;
            }

            if (
                target instanceof Node &&
                rootRef.current &&
                !rootRef.current.contains(target)
            ) {
                setPinned(false);
            }
        };

        const onEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setPinned(false);
            }
        };

        window.addEventListener('mousedown', onPointerDown);
        window.addEventListener('keydown', onEscape);
        return () => {
            window.removeEventListener('mousedown', onPointerDown);
            window.removeEventListener('keydown', onEscape);
        };
    }, [isPinned]);

    const trigger = buildTrigger(children, {
        onMouseEnter: () => setHovered(true),
        onMouseLeave: () => setHovered(false),
        onFocus: () => setFocused(true),
        onBlur: () => setFocused(false),
    });

    return (
        <span ref={rootRef} className={cx(root, className)}>
            {trigger}
            {isOpen && (
                <span className={cx(bubble, bubbleClassName)} role="tooltip">
                    {content}
                </span>
            )}
        </span>
    );
}

const root = css`
  position: relative;
  display: inline-flex;
`;

const bubble = css`
  position: absolute;
  left: 50%;
  bottom: calc(100% + var(--space-1));
  transform: translateX(-50%);
  min-width: 16rem;
  max-width: 28rem;
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  box-shadow: var(--shadow-md);
  z-index: 1050;
`;

interface TriggerEvents {
    onMouseEnter: MouseEventHandler<HTMLElement>;
    onMouseLeave: MouseEventHandler<HTMLElement>;
    onFocus: FocusEventHandler<HTMLElement>;
    onBlur: FocusEventHandler<HTMLElement>;
}

function buildTrigger(children: ReactNode, events: TriggerEvents): ReactNode {
    if (!isValidElement(children)) {
        return children;
    }

    const trigger = children as ReactElement<{
        onMouseEnter?: MouseEventHandler<HTMLElement>;
        onMouseLeave?: MouseEventHandler<HTMLElement>;
        onFocus?: FocusEventHandler<HTMLElement>;
        onBlur?: FocusEventHandler<HTMLElement>;
    }>;

    return cloneElement(trigger, {
        ...events,
        onMouseEnter: composeHandlers(
            trigger.props.onMouseEnter,
            events.onMouseEnter,
        ),
        onMouseLeave: composeHandlers(
            trigger.props.onMouseLeave,
            events.onMouseLeave,
        ),
        onFocus: composeHandlers(trigger.props.onFocus, events.onFocus),
        onBlur: composeHandlers(trigger.props.onBlur, events.onBlur),
    });
}

function composeHandlers<TEvent>(
    existing: ((event: TEvent) => void) | undefined,
    next: (event: TEvent) => void,
) {
    return (event: TEvent) => {
        existing?.(event);
        next(event);
    };
}
