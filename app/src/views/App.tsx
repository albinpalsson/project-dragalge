import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Drawer } from '../components/Drawer';
import { getStoredGameRunId, setStoredGameRunId } from '../game-view-storage';
import type { ActiveView } from '../router';
import { About } from './About';
import { AppHeader } from './AppHeader';
import { Game } from './Game/Game';
import { Home } from './Home/Home';

export function App() {
    const [activeView, setActiveView] = useState<ActiveView>(() => {
        const storedGameRunId = getStoredGameRunId();
        if (storedGameRunId) {
            return { view: 'game', gameRunId: storedGameRunId };
        }
        return { view: 'home' };
    });
    const [isMenuOpen, setMenuOpen] = useState(false);

    const navigate = (next: ActiveView) => {
        setActiveView(next);
        setStoredGameRunId(next.view === 'game' ? next.gameRunId : null);
        setMenuOpen(false);
    };

    return (
        <>
            <AppHeader onOpenMenu={() => setMenuOpen(true)} />

            {isMenuOpen && (
                <Drawer title="Menu" onClose={() => setMenuOpen(false)}>
                    <nav className={menuNav}>
                        <button
                            type="button"
                            className={menuLink}
                            onClick={() => navigate({ view: 'home' })}
                        >
                            Home
                        </button>
                        <button
                            type="button"
                            className={menuLink}
                            onClick={() => navigate({ view: 'about' })}
                        >
                            About
                        </button>
                    </nav>
                </Drawer>
            )}

            <main>
                {activeView.view === 'home' && (
                    <Home
                        onOpenGame={(gameRunId) =>
                            navigate({ view: 'game', gameRunId })
                        }
                    />
                )}
                {activeView.view === 'game' && (
                    <Game gameRunId={activeView.gameRunId} />
                )}
                {activeView.view === 'about' && <About />}
            </main>
        </>
    );
}

const menuNav = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
`;

const menuLink = css`
  padding: var(--space-2) var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-base);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;
