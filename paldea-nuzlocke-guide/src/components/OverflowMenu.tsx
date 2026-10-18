import { useEffect, useRef, useState, type ReactNode } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { IconButton } from './IconButton';
import { KebabIcon } from './icons';

interface OverflowMenuProps {
    children: ReactNode;
    label?: string;
}

interface OverflowMenuItemProps {
    children: ReactNode;
    onClick?: () => void;
    disabled?: boolean;
}

// Kebab-trigger popover for secondary/destructive actions, keeping primary actions as direct buttons.
export function OverflowMenu({
    children,
    label = 'More actions',
}: OverflowMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };
        const handleOutsideClick = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('mousedown', handleOutsideClick);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isOpen]);

    return (
        <div className={container} ref={containerRef}>
            <IconButton
                label={label}
                ariaHasPopup="menu"
                ariaExpanded={isOpen}
                onClick={() => setIsOpen((value) => !value)}
            >
                <KebabIcon />
            </IconButton>
            {isOpen && (
                <div
                    className={menu}
                    role="menu"
                    onClick={() => setIsOpen(false)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            setIsOpen(false);
                        }
                    }}
                >
                    {children}
                </div>
            )}
        </div>
    );
}

export function OverflowMenuItem({
    children,
    onClick,
    disabled = false,
}: OverflowMenuItemProps) {
    return (
        <button
            type="button"
            className={menuItem}
            onClick={onClick}
            disabled={disabled}
        >
            {children}
        </button>
    );
}

const container = css`
  position: relative;
  display: inline-flex;
`;

const menu = css`
  position: absolute;
  top: calc(100% + var(--space-1));
  right: 0;
  z-index: 1050;
  display: flex;
  flex-direction: column;
    padding: 0;
  min-width: 16rem;
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
    overflow: hidden;
`;

const menuItem = css`
    display: block;
    width: 100%;
    padding: var(--space-2) var(--space-4);
    border: none;
    border-radius: 0;
    background: transparent;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
    text-align: left;
    cursor: pointer;

    & + & {
        border-top: 0.1rem solid var(--color-border);
    }

    &:hover:not(:disabled) {
        background: var(--color-hover-overlay);
        color: var(--color-text);
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;
