import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Modal } from '../../../components/Modal';
import { MAX_PARTY_SIZE } from '../../../db/game-db/schema';
import { useGame } from '../GameContext';
import { deriveBoxSections } from './box-model';
import { BoxContents } from './BoxContents';

export function Box() {
    const game = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const { party, stored, eliminated } = deriveBoxSections(game.encounters);

    return (
        <div className={summary}>
            <span className={counts}>
                Party {party.length}/{MAX_PARTY_SIZE} · Box {stored.length} ·
                Fallen {eliminated.length}
            </span>
            <button
                type="button"
                className={toggle}
                onClick={() => setIsOpen(true)}
            >
                Open box
            </button>

            {isOpen && (
                <Modal
                    title="Box"
                    onClose={() => setIsOpen(false)}
                    className={modalPanel}
                >
                    <BoxContents />
                </Modal>
            )}
        </div>
    );
}

const summary = css`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-2);
`;

const toggle = css`
  padding: var(--space-2) var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-base);
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;

const counts = css`
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
`;

const modalPanel = css`
    && {
        width: min(96rem, 94vw);
        max-width: 96rem;
        max-height: calc(100vh - var(--space-6));
        overflow: auto;
    }
`;
