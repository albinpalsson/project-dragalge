import { useEffect, useState } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';
import { GoogleGIcon, InfoIcon } from '../components/icons';
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
    const choosing = onCancel !== undefined;
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

    const accountName = remembered ? remembered.name || remembered.email : '';

    return (
        <Modal
            title={
                choosing ? 'Keep your runs in Google Drive' : 'Continue with Google'
            }
            dismissMode={choosing ? 'any' : 'none'}
            onClose={onCancel}
        >
            <div className={content}>
                <p>
                    {choosing
                        ? 'Your runs will be saved in your own Google Drive, so you can open them on any device where you sign in.'
                        : 'Your runs are saved in your Google Drive. Google sign-ins last about an hour, so sign in again to keep loading and saving them.'}
                </p>
                {error && (
                    <p className={notice} role="alert">
                        <InfoIcon />
                        {error}
                    </p>
                )}
                <div className={mainAction}>
                    {remembered ? (
                        <button
                            type="button"
                            className={accountRow}
                            disabled={busy}
                            onClick={() =>
                                void signIn({
                                    email: remembered.email || undefined,
                                })
                            }
                        >
                            <span className={avatar} aria-hidden="true">
                                {accountName.charAt(0).toUpperCase()}
                            </span>
                            <span className={accountText}>
                                <span className={accountTitle}>
                                    Continue as {accountName}
                                </span>
                                {remembered.name && remembered.email && (
                                    <span className={accountEmail}>
                                        {remembered.email}
                                    </span>
                                )}
                            </span>
                            <GoogleGIcon />
                        </button>
                    ) : (
                        <button
                            type="button"
                            className={googleButton}
                            disabled={busy}
                            onClick={() => void signIn({})}
                        >
                            <GoogleGIcon />
                            Sign in with Google
                        </button>
                    )}
                    <p className={waiting} aria-live="polite">
                        {busy ? 'Waiting for Google…' : ''}
                    </p>
                </div>
                {(remembered || !choosing) && (
                    <div className={footer}>
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
                        {!choosing && (
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
                {choosing && (
                    <p className={privacyNote}>
                        The app can never see your other files, and your runs
                        go straight from your browser to Google.{' '}
                        <a className={textLink} href="/privacy.html">
                            Privacy policy
                        </a>
                    </p>
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
  max-width: 44rem;

  p {
    margin: 0;
  }
`;

const mainAction = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
`;

// The look Google's branding guidelines ask for on "Sign in with Google".
const googleButton = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  width: 100%;
  min-height: 4rem;
  padding: 0 var(--space-3);
  border: 0.1rem solid var(--color-google-border);
  border-radius: 2rem;
  background: var(--color-google-bg);
  color: var(--color-google-text);
  font-family: Roboto, system-ui, sans-serif;
  font-size: 1.4rem;
  font-weight: 500;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-image: linear-gradient(
      var(--color-hover-overlay),
      var(--color-hover-overlay)
    );
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

const accountRow = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-2) var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background-image: linear-gradient(
      var(--color-hover-overlay),
      var(--color-hover-overlay)
    );
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

const avatar = css`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 3.6rem;
  height: 3.6rem;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-on-primary);
  font-weight: var(--font-weight-bold);
`;

const accountText = css`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
`;

const accountTitle = css`
  font-weight: var(--font-weight-bold);
`;

const accountEmail = css`
  overflow: hidden;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const waiting = css`
  min-height: 1.5em;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
  text-align: center;
`;

const notice = css`
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-md);
  background: var(--color-warning-bg);
  color: var(--color-warning);
  font-size: var(--font-size-sm);
`;

const footer = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-1) var(--space-4);
  padding-top: var(--space-3);
  border-top: 0.1rem solid var(--color-border);
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

const privacyNote = css`
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;
