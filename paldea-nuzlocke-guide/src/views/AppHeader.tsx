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
        <header className={header}>
            {onBack && (
                <IconButton label="Back" onClick={onBack}>
                    ←
                </IconButton>
            )}
            {showTitle && <span className={title}>Paldea nuzlocke guide</span>}
            <div className={slot} ref={slotRef} />
            <div className={actions}>
                <IconButton label="Open menu" onClick={onOpenMenu}>
                    <MenuIcon />
                </IconButton>
            </div>
        </header>
    );
}

// Must not gain transform/filter: it would become the containing block for the fixed modals portaled into the slot.
const header = css`
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  height: var(--header-height);
  padding: 0 max(var(--space-4), calc((100% - var(--content-max-width)) / 2));
  background: var(--color-bg);
`;

const title = css`
    min-width: 0;
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
    line-height: 1.15;

`;

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
