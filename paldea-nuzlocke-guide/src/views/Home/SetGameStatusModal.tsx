import { useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { RadioGroup } from '../../components/RadioGroup';
import type { GameStatus } from '../../db/game-db/queries';
import { useSetGameStatus } from './queries';

const STATUS_OPTIONS: readonly { value: GameStatus; label: string }[] = [
    { value: 'won', label: 'Won' },
    { value: 'lost', label: 'Lost' },
    { value: 'in-progress', label: 'In progress' },
];

interface SetGameStatusModalProps {
    gameName: string;
    status: GameStatus;
    onClose: () => void;
}

export function SetGameStatusModal({
    gameName,
    status: currentStatus,
    onClose,
}: SetGameStatusModalProps) {
    const setGameStatus = useSetGameStatus();
    const [status, setStatus] = useState(currentStatus);
    const canSave = status !== currentStatus && !setGameStatus.isPending;

    const save = async () => {
        await setGameStatus.mutateAsync({ gameName, status });
        onClose();
    };

    return (
        <Modal title="Mark won/lost" onClose={onClose}>
            <form
                className={content}
                onSubmit={(event) => {
                    event.preventDefault();
                    if (canSave) {
                        void save().catch(() => {});
                    }
                }}
            >
                <RadioGroup
                    legend="Game status"
                    value={status}
                    options={STATUS_OPTIONS}
                    onChange={(value) => {
                        setStatus(value);
                        setGameStatus.reset();
                    }}
                />
                {setGameStatus.isError && (
                    <p className={errorText}>{setGameStatus.error.message}</p>
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
