import { Component, type ReactNode, useMemo, useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { copyText } from '../clipboard';
import { FEEDBACK_EMAIL } from '../contact';
import { buildCrashReport } from '../crash-report';
import { GameDbOwnershipError } from '../db/game-db/local-storage-plugin';
import { Button } from './Button';
import { Modal } from './Modal';
import { textLink } from './text-link';

interface Props {
    children: ReactNode;
}

interface State {
    error: unknown;
}

export class UnexpectedErrorBoundary extends Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: unknown): State {
        return { error };
    }

    componentDidMount(): void {
        window.addEventListener('error', this.handleError);
        window.addEventListener('unhandledrejection', this.handleRejection);
    }

    componentWillUnmount(): void {
        window.removeEventListener('error', this.handleError);
        window.removeEventListener('unhandledrejection', this.handleRejection);
    }

    componentDidCatch(error: Error): void {
        console.error(error);
    }

    private handleError = (event: ErrorEvent): void => {
        this.reportError(event.error ?? event.message);
        event.preventDefault();
    };

    private handleRejection = (event: PromiseRejectionEvent): void => {
        this.reportError(event.reason);
        event.preventDefault();
    };

    private reportError(error: unknown): void {
        if (this.state.error !== null) {
            return;
        }
        console.error(error);
        this.setState({ error: error ?? new Error('Unknown error') });
    }

    render(): ReactNode {
        if (this.state.error === null) {
            return this.props.children;
        }

        const { title, text, showCrashReport } = describeError(this.state.error);
        return (
            <Modal title={title} dismissMode="none">
                <p className={message}>{text}</p>
                {showCrashReport && (
                    <CrashReportActions error={this.state.error} />
                )}
                <Button onClick={() => window.location.reload()}>Reload</Button>
            </Modal>
        );
    }
}

function describeError(error: unknown): {
    title: string;
    text: string;
    showCrashReport: boolean;
} {
    if (hasOwnershipError(error)) {
        return {
            title: 'Game opened in another tab',
            text: 'Another tab has taken control of your games. Your latest change in this tab was not saved. Reload to load the latest saved data and take control here.',
            showCrashReport: false,
        };
    }
    if (isChunkLoadError(error)) {
        return {
            title: "Couldn't load part of the app",
            text: 'Part of the app could not be downloaded. This usually means your connection dropped or the site was updated while this page was open. Reload the page to continue. Your saved games are not affected.',
            showCrashReport: false,
        };
    }
    return {
        title: 'Something went wrong',
        text: 'An unexpected error occurred. Your latest changes may not have been saved. Reload to continue.',
        showCrashReport: true,
    };
}

function CrashReportActions({ error }: { error: unknown }) {
    const [copied, setCopied] = useState(false);
    const report = useMemo(() => buildCrashReport(error), [error]);

    const handleCopy = async () => {
        const success = await copyText(
            `To: ${FEEDBACK_EMAIL}\nSubject: ${report.subject}\n\n${report.body}`,
        );
        setCopied(success);
        if (success) {
            window.setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <p className={message}>
                If this keeps happening, please email the details to{' '}
                {FEEDBACK_EMAIL}. The report contains the error and your
                browser, but no game data.
            </p>
            <div className={actions}>
                <a className={textLink} href={report.mailto}>
                    Email report
                </a>
                <button type="button" className={textLink} onClick={handleCopy}>
                    {copied ? 'Copied' : 'Copy report'}
                </button>
            </div>
            <textarea
                className={reportText}
                readOnly
                aria-label="Crash report"
                value={report.body}
                onFocus={(event) => event.currentTarget.select()}
            />
        </>
    );
}

function hasOwnershipError(error: unknown): boolean {
    const seen = new Set<unknown>();
    while (error instanceof Error && !seen.has(error)) {
        if (error instanceof GameDbOwnershipError) {
            return true;
        }
        seen.add(error);
        error = 'cause' in error ? error.cause : undefined;
    }
    return false;
}

// The bundler's runtime rejects a failed chunk load with an Error named
// "ChunkLoadError" (see the lazy-loading contract in bundler/AGENTS.md).
function isChunkLoadError(error: unknown): boolean {
    const seen = new Set<unknown>();
    while (error instanceof Error && !seen.has(error)) {
        if (error.name === 'ChunkLoadError') {
            return true;
        }
        seen.add(error);
        error = 'cause' in error ? error.cause : undefined;
    }
    return false;
}

const message = css`
  margin: 0;
`;

const actions = css`
  display: flex;
  gap: var(--space-4);
`;

const reportText = css`
  width: 100%;
  height: 8rem;
  padding: var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--color-surface);
  color: var(--color-text);
  font-family: monospace;
  font-size: var(--font-size-sm);
  resize: vertical;
`;