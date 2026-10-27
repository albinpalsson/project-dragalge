import { useEffect, useRef, useState, type ReactNode } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';
import { Drawer } from '../components/Drawer';
import { HeaderSlotContext } from '../components/HeaderSlot';
import { IconLink } from '../components/IconLink';
import { GithubIcon, MailIcon } from '../components/icons';
import { GITHUB_REPO_URL, buildMailto } from '../contact';
import { About } from './About';
import { AppHeader } from './AppHeader';
import { Friendship } from './Friendship';
import { Game } from './Game/Game';
import { Home } from './Home/Home';
import { Licenses } from './Licenses';
import { ThemeToggle } from './ThemeToggle';
import { useImportDataFromHash } from '../hooks/useImportDataFromHash';
import { useViewNavigation } from '../hooks/useViewNavigation';
import { useReleaseNews } from '../hooks/useReleaseNews';
import { track } from '../analytics/analytics';

export function App() {
    // Establishes the browser baseline; connect pending news and explicit
    // acknowledgment to a presentation here when the first news is published.
    useReleaseNews();
    const { importData } = useImportDataFromHash();
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [headerSlot, setHeaderSlot] = useState<HTMLElement | null>(null);
    const { activeView, navigate } = useViewNavigation({
        onViewChange: () => setMenuOpen(false),
        startAtHome: importData !== undefined,
    });
    const activeViewKey =
        activeView.view === 'game'
            ? `${activeView.view}:${activeView.gameName}`
            : activeView.view;
    const previousActiveViewKey = useRef(activeViewKey);

    useEffect(() => {
        if (previousActiveViewKey.current !== activeViewKey) {
            window.scrollTo(0, 0);
            previousActiveViewKey.current = activeViewKey;
        }
    }, [activeViewKey]);

    useEffect(() => {
        track({ name: 'page_view', view: activeView.view });
    }, [activeView.view]);

    return (
        <>
            <AppHeader
                onBack={
                    activeView.view === 'game'
                        ? () => navigate({ view: 'home' })
                        : undefined
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
                        <MenuLink
                            isCurrent={activeView.view === 'home'}
                            onClick={() => navigate({ view: 'home' })}
                        >
                            Home
                        </MenuLink>
                        <MenuLink
                            isCurrent={activeView.view === 'about'}
                            onClick={() => navigate({ view: 'about' })}
                        >
                            About
                        </MenuLink>
                        <MenuLink
                            isCurrent={activeView.view === 'licenses'}
                            onClick={() => navigate({ view: 'licenses' })}
                        >
                            Licenses &amp; Notices
                        </MenuLink>
                        <hr className={menuDivider} />
                        <MenuLink
                            secondary
                            isCurrent={activeView.view === 'friendship'}
                            onClick={() => navigate({ view: 'friendship' })}
                        >
                            Friendship mechanics
                        </MenuLink>
                    </nav>
                    <div className={menuFooter}>
                        <IconLink
                            label="GitHub repository"
                            href={GITHUB_REPO_URL}
                            external
                        >
                            <GithubIcon />
                        </IconLink>
                        <IconLink
                            label="Email feedback"
                            href={buildMailto('Paldea Nuzlocke Guide feedback')}
                        >
                            <MailIcon />
                        </IconLink>
                    </div>
                </Drawer>
            )}

            <HeaderSlotContext.Provider value={headerSlot}>
                <main>
                    {activeView.view === 'home' && (
                        <Home
                            onOpenGame={(gameName) =>
                                navigate({ view: 'game', gameName })
                            }
                            onOpenAbout={() => navigate({ view: 'about' })}
                            onOpenLicenses={() =>
                                navigate({ view: 'licenses' })
                            }
                        />
                    )}
                    {activeView.view === 'game' && (
                        <Game gameName={activeView.gameName} />
                    )}
                    {activeView.view === 'about' && (
                        <About
                            onOpenLicenses={() =>
                                navigate({ view: 'licenses' })
                            }
                            onOpenFriendship={() =>
                                navigate({ view: 'friendship' })
                            }
                        />
                    )}
                    {activeView.view === 'friendship' && <Friendship />}
                    {activeView.view === 'licenses' && <Licenses />}
                </main>
            </HeaderSlotContext.Provider>
        </>
    );
}

interface MenuLinkProps {
    isCurrent: boolean;
    secondary?: boolean;
    onClick: () => void;
    children: ReactNode;
}

function MenuLink({
    isCurrent,
    secondary = false,
    onClick,
    children,
}: MenuLinkProps) {
    return (
        <button
            type="button"
            className={cx(menuLink, secondary && menuLinkSecondary)}
            aria-current={isCurrent ? 'page' : undefined}
            onClick={onClick}
        >
            {children}
        </button>
    );
}

const menuNav = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

const menuFooter = css`
  display: flex;
  gap: var(--space-2);
  margin-top: auto;
`;

const menuDivider = css`
  width: 100%;
  margin: var(--space-1) 0;
  border: 0;
  border-top: 0.1rem solid var(--color-border);
`;

const menuLink = css`
  padding: var(--space-2) var(--space-3);
  border: 0;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-base);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }

  &:focus-visible {
    outline: 0.2rem solid var(--color-accent);
    outline-offset: 0.1rem;
  }

  &[aria-current='page'] {
    background: var(--color-hover-overlay);
    font-weight: var(--font-weight-bold);
  }
`;

const menuLinkSecondary = css`
  && {
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
`;
