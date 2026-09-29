import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Drawer } from '../components/Drawer';
import { HeaderSlotContext } from '../components/HeaderSlot';
import { About } from './About';
import { AppHeader } from './AppHeader';
import { Game } from './Game/Game';
import { Home } from './Home/Home';
import { ThemeToggle } from './ThemeToggle';
import { useImportDataFromHash } from '../hooks/useImportDataFromHash';
import { useViewNavigation } from '../hooks/useViewNavigation';

export function App() {
    const { importData } = useImportDataFromHash();
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
    const { activeView, navigate } = useViewNavigation({
        onViewChange: () => setMenuOpen(false),
        startAtHome: importData !== undefined,
    });

    return (
        <>
            <AppHeader
                onBack={
                    activeView.view === 'home'
                        ? undefined
                        : () => navigate({ view: 'home' })
                }
                onOpenMenu={() => setMenuOpen(true)}
                showTitle={activeView.view !== 'game'}
                slotRef={setHeaderSlot}
            />

            {isMenuOpen && (
                <Drawer
                    title="Menu"
                    headerAction={<ThemeToggle />}
                    onClose={() => setMenuOpen(false)}
                >
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

            <HeaderSlotContext.Provider value={headerSlot}>
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
            </HeaderSlotContext.Provider>
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
