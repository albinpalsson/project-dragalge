import { useEffect, type ReactNode } from 'react';
import { css, cx } from '@pokedb2/css-in-js';

interface ModalProps {
    title?: string;
    onClose: () => void;
    children: ReactNode;
    className?: string;
}

export function Modal({ title, onClose, children, className }: ModalProps) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        // biome-ignore lint/a11y/useSemanticElements: Modal overlay pattern
        <div
            className={overlay}
            onClick={handleOverlayClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleOverlayClick(
                        e as unknown as React.MouseEvent<HTMLDivElement>,
                    );
                }
            }}
        >
            <div
                className={cx(panel, className)}
                role="dialog"
                aria-modal="true"
            >
                <div className={header}>
                    {title && <h2>{title}</h2>}
                    <button
                        type="button"
                        className={closeButton}
                        onClick={onClose}
                        aria-label="Close dialog"
                    >
                        ✕
                    </button>
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-3);
  margin: -0.5rem;

  h2 {
    margin: 0.5rem 0;
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
