import { useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { usePokemonEvolutionQuery } from '../views/Game/Box/queries';
import { FriendshipGuide } from './FriendshipGuide';
import { HeartIcon } from './icons';
import { IconButton } from './IconButton';
import { Modal } from './Modal';

interface FriendshipHintButtonProps {
    pokemonName: string;
    label?: string;
}

export function isFriendshipEvolutionMethod(method: string): boolean {
    return /high friendship/i.test(method);
}

// Shown only while the Pokémon has a friendship evolution.
export function FriendshipHintButton({
    pokemonName,
    label,
}: FriendshipHintButtonProps) {
    const evolutionQuery = usePokemonEvolutionQuery(pokemonName);
    const hasFriendshipEvolution =
        evolutionQuery.data?.nextEvolutions.some((evolution) =>
            isFriendshipEvolutionMethod(evolution.method),
        ) ?? false;

    if (!hasFriendshipEvolution) {
        return null;
    }

    if (!label) {
        return <FriendshipGuideButton />;
    }

    return (
        <div className={labelRow}>
            <span>{label}</span>
            <FriendshipGuideButton />
        </div>
    );
}

export function FriendshipGuideButton() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IconButton
                label="Friendship mechanics"
                onClick={() => setIsOpen(true)}
            >
                <HeartIcon />
            </IconButton>
            {isOpen && (
                <Modal
                    title="Friendship mechanics"
                    onClose={() => setIsOpen(false)}
                    className={modalPanel}
                >
                    <FriendshipGuide />
                </Modal>
            )}
        </>
    );
}

const labelRow = css`
    display: flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const modalPanel = css`
    && {
        width: min(96rem, 94vw);
        max-width: 96rem;
    }
`;
