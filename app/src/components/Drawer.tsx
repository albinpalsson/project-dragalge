import { useEffect, type ReactNode } from 'react';
import { css, cx } from '@pokedb2/css-in-js';

interface DrawerProps {
    title?: string;
    headerAction?: ReactNode;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}

export function Drawer({
    title,
    headerAction,
    onClose,
    children,
    className,
}: DrawerProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className={overlay}>
            <button
                type="button"
                className={backdrop}
                aria-label="Close menu"
                onClick={onClose}
            />
            <div
                className={cx(panel, className)}
                role="dialog"
                aria-modal="true"
            >
                {(title || headerAction) && (
                    <div className={header}>
                        {title && <h2>{title}</h2>}
                        {headerAction}
                    </div>
                )}
                {children}
            </div>
        </div>
    );
}

const overlay = css`
  position: fixed;
  inset: 0;
  z-index: 1100;
`;

const backdrop = css`
  position: absolute;
  inset: 0;
  width: 100%;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0.4rem);
  cursor: pointer;
`;

const header = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);

  h2 {
    margin: 0;
  }
`;

const panel = css`
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 28rem;
  max-width: 85vw;
  padding: var(--space-4);
  background: var(--color-surface);
  border-left: 0.1rem solid var(--color-border);
  box-shadow: var(--shadow-md);
`;
