import { useState } from 'react';
import { css } from '@pokedb2/css-in-js';
import { Modal } from '../../../components/Modal';
import { BoxIcon } from '../../../components/icons';
import { MAX_PARTY_SIZE } from '../../../db/game-db/schema';
import { useGame } from '../GameContext';
import { deriveBoxSections } from './box-model';
import { BoxContents } from './BoxContents';

export function Box() {
    const game = useGame();
    const [isOpen, setIsOpen] = useState(false);
    const { party, stored, eliminated } = deriveBoxSections(game.encounters);
    const total = party.length + stored.length + eliminated.length;
    const label = `Open box (Party ${party.length}/${MAX_PARTY_SIZE}, Box ${stored.length}, Fallen ${eliminated.length})`;

    return (
        <>
            <button
                type="button"
                className={toggle}
                onClick={() => setIsOpen(true)}
                aria-label={label}
                title={label}
            >
                {total}
                <BoxIcon />
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
        </>
    );
}

const toggle = css`
  display: inline-flex;
  align-items: center;
  flex: none;
  gap: var(--space-2);
  height: 3.6rem;
  padding: 0 var(--space-3);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-base);
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s;

  &:hover {
    background: var(--color-hover-overlay);
  }

  &:focus-visible {
    outline: 0.2rem solid var(--color-accent);
    outline-offset: 0.1rem;
  }
`;

const modalPanel = css`
    && {
        width: min(96rem, 94vw);
        max-width: 96rem;
        max-height: calc(100vh - var(--space-6));
        overflow: auto;
    }
`;
