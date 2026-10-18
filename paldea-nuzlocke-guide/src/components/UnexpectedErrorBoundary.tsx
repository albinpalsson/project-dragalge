import { Component, type ReactNode } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { GameDbOwnershipError } from '../db/game-db/local-storage-plugin';
import { Button } from './Button';
import { Modal } from './Modal';

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

        const ownershipLost = hasOwnershipError(this.state.error);
        return (
            <Modal title={ownershipLost ? 'Game opened in another tab' : 'Something went wrong'} dismissMode="none">
                <p className={message}>
                    {ownershipLost
                        ? 'Another tab has taken control of your games. Your latest change in this tab was not saved. Reload to load the latest saved data and take control here.'
                        : 'An unexpected error occurred. Your latest changes may not have been saved. Reload to continue.'}
                </p>
                <Button onClick={() => window.location.reload()}>Reload</Button>
            </Modal>
        );
    }
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

const message = css`
  margin: 0;
`;