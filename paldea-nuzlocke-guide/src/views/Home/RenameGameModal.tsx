import { useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { TextField } from '../../components/TextField';
import { GAME_NAME_MAX_BYTES } from '../../db/game-db/queries';
import { useRenameGame } from './queries';

interface RenameGameModalProps {
    gameName: string;
    onClose: () => void;
}

export function RenameGameModal({ gameName, onClose }: RenameGameModalProps) {
    const renameGame = useRenameGame();
    const [name, setName] = useState(gameName);
    const trimmedName = name.trim();
    const canSave =
        trimmedName !== '' && trimmedName !== gameName && !renameGame.isPending;

    const save = async () => {
        await renameGame.mutateAsync({ gameName, newName: name });
        onClose();
    };

    return (
        <Modal title="Edit name" onClose={onClose}>
            <form
                className={content}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (canSave) {
                        void save().catch(() => {});
                    }
                }}
            >
                <TextField
                    label="Game name"
                    value={name}
                    onChange={(value) => {
                        setName(value);
                        renameGame.reset();
                    }}
                    maxLength={GAME_NAME_MAX_BYTES}
                />
                {renameGame.isError && (
                    <p className={errorText}>{renameGame.error.message}</p>
                )}
                <div className={actions}>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!canSave}>
                        Save
                    </Button>
                </div>
            </form>
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
