import { useState } from 'react';
import { css } from '@project-dragalge/css-in-js';
import { Button } from '../../../components/Button';
import {
    FriendshipGuideButton,
    isFriendshipEvolutionMethod,
} from '../../../components/FriendshipHintButton';
import { Modal } from '../../../components/Modal';
import type { EvolutionTarget } from '../../../db/pokemon-data/queries';

interface PokemonEvolutionSectionProps {
    evolutions: EvolutionTarget[];
    isBusy: boolean;
    onEvolve: (pokemonName: string) => void;
}

export function PokemonEvolutionSection({
    evolutions,
    isBusy,
    onEvolve,
}: PokemonEvolutionSectionProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (evolutions.length === 0) {
        return null;
    }

    const methodNote = getMethodNote(evolutions);

    if (evolutions.length === 1) {
        return (
            <section className={section} aria-label="Evolution">
                <EvolutionOption
                    evolution={evolutions[0]}
                    isBusy={isBusy}
                    onEvolve={onEvolve}
                />
            </section>
        );
    }

    return (
        <section className={section} aria-label="Evolution">
            <span className={summary}>
                {evolutions.length} evolution paths available
                {methodNote && ` - ${methodNote}`}
            </span>
            <Button variant="secondary" onClick={() => setIsOpen(true)}>
                View paths
            </Button>
            {isOpen && (
                <Modal title="Evolution paths" onClose={() => setIsOpen(false)}>
                    <div className={options}>
                        {evolutions.map((option) => (
                            <EvolutionOption
                                key={`${option.pokemonName}-${option.method}`}
                                evolution={option}
                                isBusy={isBusy}
                                onEvolve={(pokemonName) => {
                                    setIsOpen(false);
                                    onEvolve(pokemonName);
                                }}
                            />
                        ))}
                    </div>
                </Modal>
            )}
        </section>
    );
}

const METHOD_NOTES: readonly (readonly [RegExp, string])[] = [
    [
        /^nectar$/i,
        'Nectar is available at the Delibird Presents store after defeating Iono.',
    ],
    [
        /^rotom catalog$/i,
        'The Rotom Catalog can be bought at the Porto Marinada Market once you finish the Cascarrafa Gym\'s test.',
    ],
];

function getMethodNote(evolutions: EvolutionTarget[]): string | undefined {
    return METHOD_NOTES.find(([pattern]) =>
        evolutions.some((evolution) => pattern.test(evolution.method)),
    )?.[1];
}

interface EvolutionOptionProps {
    evolution: EvolutionTarget;
    isBusy: boolean;
    onEvolve: (pokemonName: string) => void;
}

function EvolutionOption({
    evolution,
    isBusy,
    onEvolve,
}: EvolutionOptionProps) {
    return (
        <div className={option}>
            <div className={optionDetails}>
                <span>
                    Evolves into <strong>{evolution.pokemonName}</strong>
                </span>
                <span className={method}>({evolution.method})</span>
            </div>
            <div className={optionButtons}>
                {isFriendshipEvolutionMethod(evolution.method) && (
                    <FriendshipGuideButton />
                )}
                <Button
                    variant="secondary"
                    className={evolveButton}
                    ariaLabel="Evolve"
                    title="Evolve"
                    disabled={isBusy}
                    onClick={() => onEvolve(evolution.pokemonName)}
                >
                    ➕
                </Button>
            </div>
        </div>
    );
}

const section = css`
  display: flex;
    flex: 1 1 100%;
    flex-wrap: wrap;
    align-items: center;
  gap: var(--space-2);
    min-width: 0;
`;

const options = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const option = css`
  display: flex;
    flex: 1;
  align-items: center;
  gap: var(--space-3);
`;

const optionButtons = css`
    display: flex;
    flex: 0 0 auto;
    align-items: center;
    gap: var(--space-1);
`;

const optionDetails = css`
  display: flex;
  flex: 0 1 auto;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2);
    min-width: 0;
`;

const method = css`
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const summary = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;

const evolveButton = css`
    flex: 0 0 auto;
    min-width: 3.2rem;
    min-height: 3.2rem;
    padding: var(--space-1);
    background: var(--color-surface-alt);
`;
