import { css } from '@project-dragalge/css-in-js';
import { IconButton } from '../components/IconButton';
import { MenuIcon } from '../components/icons';

interface AppHeaderProps {
    onBack?: () => void;
    onOpenMenu: () => void;
    showTitle: boolean;
    slotRef: (element: HTMLDivElement | null) => void;
}

export function AppHeader({
    onBack,
    onOpenMenu,
    showTitle,
    slotRef,
}: AppHeaderProps) {
    return (
        <header className="app-header">
            {onBack && (
                <IconButton label="Back" onClick={onBack}>
                    ←
                </IconButton>
            )}
            {showTitle && (
                <span className="app-header-title">Paldea nuzlocke guide</span>
            )}
            <div className={slot} ref={slotRef} />
            <div className={actions}>
                <IconButton label="Open menu" onClick={onOpenMenu}>
                    <MenuIcon />
                </IconButton>
            </div>
        </header>
    );
}

const slot = css`
  display: flex;
  flex: 1;
  align-items: center;
  gap: var(--space-2);
  min-width: 0;
`;

const actions = css`
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--space-1);
  margin-left: auto;
`;
