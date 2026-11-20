import { useEffect, useState } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';
import { Modal } from '../components/Modal';
import { textLink } from '../components/text-link';
import { getStorageMode } from '../db/game-db/storage-mode';
import {
    getRememberedAccount,
    rememberSignedInAccount,
} from '../storage/google-account';
import { preloadGoogleSignIn, signInToGoogle } from '../storage/google-auth';
import { switchStorage } from '../storage/switch-storage';

interface GoogleLoginModalProps {
    // Present when the user is only considering Google Drive (they can back
    // out with the close button). Absent when their games are already kept
    // there and they must sign in.
    onCancel?: () => void;
}

export function GoogleLoginModal({ onCancel }: GoogleLoginModalProps) {
    const remembered = getRememberedAccount();
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        // A sign-in popup only opens straight from a click, so be ready for one.
        preloadGoogleSignIn().catch(() => {});
    }, []);

    const signIn = async (options: {
        email?: string;
        chooseAccount?: boolean;
    }) => {
        setBusy(true);
        setError(null);
        try {
            await signInToGoogle(options);
            const account = await rememberSignedInAccount();
            // Another account or place holds other games, so start over there.
            // Signing in again as the same account carries on where it was.
            if (
                getStorageMode() !== 'google-drive' ||
                (remembered && remembered.email !== account.email)
            ) {
                switchStorage('google-drive');
            }
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : 'Google sign-in did not finish.',
            );
            setBusy(false);
        }
    };

    return (
        <Modal
            title="Sign in to Google"
            dismissMode={onCancel ? 'any' : 'none'}
            onClose={onCancel}
        >
            <div className={content}>
                <p>
                    Your games are stored in your own Google Drive. Sign in to
                    open and save them.
                </p>
                {error && <p className={errorText}>{error}</p>}
                {remembered ? (
                    <button
                        type="button"
                        className={accountCard}
                        disabled={busy}
                        onClick={() =>
                            void signIn({
                                email: remembered.email || undefined,
                            })
                        }
                    >
                        <span className={cardTitle}>
                            Continue as {remembered.name || remembered.email}
                        </span>
                        {remembered.name && remembered.email && (
                            <span className={cardDetail}>
                                {remembered.email}
                            </span>
                        )}
                    </button>
                ) : (
                    <button
                        type="button"
                        className={accountCard}
                        disabled={busy}
                        onClick={() => void signIn({})}
                    >
                        <span className={cardTitle}>Sign in with Google</span>
                    </button>
                )}
                {(remembered || !onCancel) && (
                    <div className={links}>
                        {remembered && (
                            <button
                                type="button"
                                className={cx(textLink, smallLink)}
                                disabled={busy}
                                onClick={() =>
                                    void signIn({ chooseAccount: true })
                                }
                            >
                                Use a different account
                            </button>
                        )}
                        {!onCancel && (
                            <button
                                type="button"
                                className={cx(textLink, smallLink)}
                                onClick={() => switchStorage('local')}
                            >
                                Use this browser instead
                            </button>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-2);

  p {
    margin: 0;
  }
`;

// The main action: an outlined card in the primary colour.
const accountCard = css`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-1);
  padding: var(--space-3) var(--space-4);
  border: 0.15rem solid var(--color-primary);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--color-hover-overlay);
  }

  &:focus-visible {
    outline: 0.2rem solid var(--color-accent);
    outline-offset: 0.1rem;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const cardTitle = css`
  font-weight: var(--font-weight-bold);
`;

const cardDetail = css`
  font-size: var(--font-size-sm);
  opacity: 0.8;
`;

// The other actions: small text links rather than buttons.
const links = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-1) var(--space-4);
`;

const smallLink = css`
  && {
    font-size: var(--font-size-sm);
    font-weight: normal;
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const errorText = css`
  color: var(--color-danger);
`;
