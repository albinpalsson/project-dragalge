import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useGameExport } from './queries';

interface ExportGameModalProps {
    gameRunId: number;
    onClose: () => void;
}

export function ExportGameModal({ gameRunId, onClose }: ExportGameModalProps) {
    const [copyError, setCopyError] = useState<string | undefined>();
    const exportedGame = useGameExport(gameRunId);
    const exportLink = exportedGame.isSuccess
        ? buildExportLink(exportedGame.data)
        : undefined;

    const copyLink = async () => {
        if (!exportLink) {
            return;
        }
        try {
            await navigator.clipboard.writeText(exportLink);
            setCopyError(undefined);
        } catch {
            setCopyError(
                'Unable to copy the link. Select and copy it manually.',
            );
        }
    };

    return (
        <Modal title="Export game" onClose={onClose} dismissMode="closeButton">
            <div className={content}>
                <p>
                    This link contains this game&apos;s progress. Anyone with
                    the link can import a copy into their tracker.
                </p>
                {exportedGame.isPending && <p>Preparing link...</p>}
                {exportedGame.isError && (
                    <p className={errorText}>
                        Unable to create the export link.
                    </p>
                )}
                {exportLink && (
                    <>
                        <label className={linkField}>
                            Shareable link
                            <input value={exportLink} readOnly />
                        </label>
                        {copyError && <p className={errorText}>{copyError}</p>}
                        <div className={actions}>
                            <Button onClick={() => void copyLink()}>
                                Copy link
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
}

function buildExportLink(exportedGame: string): string {
    return `${window.location.origin}${window.location.pathname}#import=${encodeURIComponent(exportedGame)}`;
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  p {
    margin: 0;
  }
`;

const linkField = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);

  input {
    width: 100%;
    padding: var(--space-2);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    background: var(--color-bg);
    color: var(--color-text);
  }
`;

const actions = css`
  display: flex;
  gap: var(--space-2);
`;

const errorText = css`
  color: var(--color-danger);
`;
