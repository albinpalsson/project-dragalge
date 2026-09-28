import { useEffect, useId, type ReactNode } from 'react';
import { css, cx } from '@pokedb2/css-in-js';

interface ModalProps {
    title?: string;
    onClose?: () => void;
    children: ReactNode;
    className?: string;
    dismissMode?: 'any' | 'closeButton' | 'none';
}

export function Modal({ title, onClose, children, className, dismissMode = 'any' }: ModalProps) {
    const titleId = useId();
    useEffect(() => {
        if (dismissMode !== 'any' || !onClose) {
            return;
        }
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, dismissMode]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose?.();
        }
    };

    return (
        // biome-ignore lint/a11y/noStaticElementInteractions: Only the default mode enables overlay interaction.
        <div
            className={overlay}
            onClick={dismissMode === 'any' ? handleOverlayClick : undefined}
            role={dismissMode === 'any' ? 'button' : undefined}
            tabIndex={dismissMode === 'any' ? 0 : undefined}
            onKeyDown={dismissMode === 'any' ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleOverlayClick(
                        e as unknown as React.MouseEvent<HTMLDivElement>,
                    );
                }
            } : undefined}
        >
            <div
                className={cx(panel, className)}
                role="dialog"
                aria-modal="true"
                aria-labelledby={title ? titleId : undefined}
            >
                <div className={header}>
                    {title && <h2 id={titleId}>{title}</h2>}
                    {dismissMode !== 'none' && onClose && (
                        <button
                            type="button"
                            className={closeButton}
                            onClick={onClose}
                            aria-label="Close dialog"
                        >
                            ✕
                        </button>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}

const overlay = css`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(0.4rem);
  z-index: 1000;
`;

const panel = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  width: 90vw;
  max-width: 40rem;
  padding: var(--space-4);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
`;

const header = css`
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-3);
    margin: -0.5rem;
    padding: 0.5rem;
    background: var(--color-surface);
    box-shadow: 0 0.8rem 1.2rem -1.2rem rgba(0, 0, 0, 0.7);

  h2 {
        margin: 0;
  }
`;

const closeButton = css`
  flex-shrink: 0;
  width: 2.4rem;
  height: 2.4rem;
  padding: 0;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-lg);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;
