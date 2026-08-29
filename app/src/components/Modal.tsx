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

    return (
        <div className={overlay}>
            <div
                className={cx(panel, className)}
                role="dialog"
                aria-modal="true"
            >
                {title && <h2>{title}</h2>}
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
