import { lazy, Suspense, useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { Button } from '../../components/Button';

const NewGameDialog = lazy(() =>
    import(/* bundler:prefetch */ './NewGameDialog').then((module) => ({
        default: module.NewGameDialog,
    })),
);

interface NewGameModalProps {
    onOpenGame: (gameName: string) => void;
}

export function NewGameModal({ onOpenGame }: NewGameModalProps) {
    const [isStartModalOpen, setStartModalOpen] = useState(false);

    return (
        <>
            <Button
                className={startButton}
                onClick={() => setStartModalOpen(true)}
            >
                Start New Game
            </Button>

            {isStartModalOpen && (
                <Suspense fallback={null}>
                    <NewGameDialog
                        onClose={() => setStartModalOpen(false)}
                        onOpenGame={onOpenGame}
                    />
                </Suspense>
            )}
        </>
    );
}

const startButton = css`
  align-self: flex-start;
`;
