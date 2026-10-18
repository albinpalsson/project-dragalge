import { css } from '@project-dragalge/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { useDeleteGame } from './queries';

interface DeleteGameModalProps {
    gameRunId: number;
    gameName: string;
    onClose: () => void;
}

export function DeleteGameModal({
    gameRunId,
    gameName,
    onClose,
}: DeleteGameModalProps) {
    const deleteGame = useDeleteGame();

    const confirmDelete = async () => {
        await deleteGame.mutateAsync(gameRunId);
        onClose();
    };

    return (
        <Modal title="Delete game" onClose={onClose}>
            <div className={content}>
                <p>
                    Permanently delete &quot;{gameName}&quot; and all of its
                    progress? This cannot be undone.
                </p>
                {deleteGame.isError && (
                    <p className={errorText}>Unable to delete the game.</p>
                )}
                <div className={actions}>
                    <Button variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="warm"
                        disabled={deleteGame.isPending}
                        onClick={() => void confirmDelete().catch(() => {})}
                    >
                        Delete
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
