import { useEffect, useRef, useState, type ReactNode } from 'react';
import { css } from '@pokedb2/css-in-js';
import { IconButton } from './IconButton';
import { KebabIcon } from './icons';

interface OverflowMenuProps {
    children: ReactNode;
    label?: string;
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
  gap: var(--space-1);
  padding: var(--space-2);
  min-width: 16rem;
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
`;
