import { css } from '@pokedb2/css-in-js';
import { ThemeToggle } from './ThemeToggle';

interface AppHeaderProps {
    onBack?: () => void;
    onOpenMenu: () => void;
}

export function AppHeader({ onBack, onOpenMenu }: AppHeaderProps) {
    return (
        <header className={header}>
            <div className={brand}>
                {onBack && (
                    <button
                        type="button"
                        className={backButton}
                        onClick={onBack}
                        aria-label="Back"
                        title="Back"
                    >
                        ←
                    </button>
                )}
                <span className={title}>PokeDB</span>
            </div>
            <div className={actions}>
                <ThemeToggle />
                <button
                    type="button"
                    className={menuButton}
                    onClick={onOpenMenu}
                >
                    Open menu
                </button>
            </div>
        </header>
    );
}

const header = css`
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  height: var(--header-height);
  padding: 0 var(--space-4);
  background: var(--color-surface);
  border-bottom: 0.1rem solid var(--color-border);
`;

const brand = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const title = css`
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
`;

const actions = css`
  display: flex;
  align-items: center;
  gap: var(--space-2);
`;

const backButton = css`
  width: 4rem;
  height: 4rem;
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-lg);
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;

const menuButton = css`
  height: 4rem;
  padding: 0 var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: var(--font-size-base);
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;
