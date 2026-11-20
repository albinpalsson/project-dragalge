import { useState } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';
import { getStorageMode } from '../../db/game-db/storage-mode';
import { isDriveConfigured } from '../../storage/config';
import { isSignedIn } from '../../storage/google-auth';
import { switchStorage } from '../../storage/switch-storage';
import { GoogleLoginModal } from '../GoogleLoginModal';

const OPTIONS = [
    { value: 'local', label: 'This browser' },
    { value: 'google-drive', label: 'Google Drive' },
];

// Where the games are kept. Games live in one place at a time: the other
// place's games are left as they are and are not shown.
export function StorageSelect({ className }: { className?: string }) {
    const [signingIn, setSigningIn] = useState(false);
    if (!isDriveConfigured) {
        return null;
    }

    const choose = (value: string) => {
        if (value === 'local') {
            switchStorage('local');
        } else if (isSignedIn()) {
            switchStorage('google-drive');
        } else {
            setSigningIn(true);
        }
    };

    return (
        <>
            <select
                aria-label="Stored in"
                className={cx(select, className)}
                value={getStorageMode()}
                onChange={(event) => choose(event.target.value)}
            >
                {OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {signingIn && (
                <GoogleLoginModal onCancel={() => setSigningIn(false)} />
            )}
        </>
    );
}

// A quiet control: faded text, small and rounded, so it reads as a setting
// next to the heading rather than a form field.
const select = css`
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;

  &:hover {
    color: var(--color-text-secondary);
  }
`;
