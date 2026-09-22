import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import type { ParsedImport } from '../../db/game-db/export-import';
import { GAME_NAME_MAX_BYTES } from '../../db/game-db/queries';
import { useImportDataFromHash } from '../../hooks/useImportDataFromHash';
import { useImportGame, useParsedGameImport } from './queries';

export function ImportGameModal() {
    const { importData, dismissImport } = useImportDataFromHash();
    if (importData === undefined) {
        return null;
    }

    return (
        <ImportGameDialog
            importData={importData}
            onClose={dismissImport}
        />
    );
}

function ImportGameDialog({
    importData,
    onClose,
}: {
    importData: string;
    onClose: () => void;
}) {
    const parsedImport = useParsedGameImport(importData);

    if (parsedImport.isPending) {
        return (
            <Modal title="Import game" onClose={onClose}>
                <p>Preparing import...</p>
            </Modal>
        );
    }

    if (parsedImport.isError) {
        return (
            <Modal title="Import game" onClose={onClose}>
                <div className={content}>
                    <p className={errorText}>Unable to read this import.</p>
                    <Button onClick={onClose}>Dismiss</Button>
                </div>
            </Modal>
        );
    }

    const parsed = parsedImport.data;
    if (parsed.status === 'error') {
        return (
            <Modal title="Import game" onClose={onClose}>
                <div className={content}>
                    <p className={errorText}>{parsed.message}</p>
                    <Button onClick={onClose}>Dismiss</Button>
                </div>
            </Modal>
        );
    }

    return <ImportForm parsed={parsed} onClose={onClose} />;
}

function ImportForm({
    parsed,
    onClose,
}: {
    parsed: Extract<ParsedImport, { status: 'ok' }>;
    onClose: () => void;
}) {
    const [name, setName] = useState(parsed.game.name);
    const importGame = useImportGame();

    const importRun = async () => {
        await importGame.mutateAsync({ parsed, name });
        onClose();
    };

    return (
        <Modal title="Import game" onClose={onClose}>
            <div className={content}>
                <p>A copy of this game will be added to your tracker.</p>
                <TextField
                    label="Name this game"
                    value={name}
                    onChange={setName}
                    maxLength={GAME_NAME_MAX_BYTES}
                />
                {importGame.isError && (
                    <p className={errorText}>{importGame.error.message}</p>
                )}
                <div className={actions}>
                    <Button
                        onClick={() => void importRun()}
                        disabled={importGame.isPending || name.trim().length === 0}
                    >
                        Import
                    </Button>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                </div>
            </div>
        </Modal>
    );
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  p {
    margin: 0;
  }
`;

const actions = css`
  display: flex;
  gap: var(--space-2);
`;

const errorText = css`
  color: var(--color-danger);
`;