import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import { pokemonIconSrc, toIconSlug } from '../../pokemon-icon';

import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import { useEncounterActions } from '../../hooks/useEncounterActions';
import { useGame } from './GameContext';

export function StarterCard() {
    const game = useGame();
    const encounterActions = useEncounterActions();

    const randomizeStarter = () => {
        const pick = randomStarter();
        void encounterActions.chooseStarter(pick, STARTER_LOCATION_NAME);
    };

    const starter = game.encounters.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    )?.pokemon_name;

    return (
        <article className={card}>
            <h3 className={heading}>Starter - Cabo poco</h3>

            {starter ? (
                <div className={chosenBox}>
                    <img
                        className={chosenIcon}
                        src={pokemonIconSrc(toIconSlug(starter))}
                        alt={starter}
                        loading="lazy"
                    />
                    <span>{starter}</span>
                </div>
            ) : (
                <>
                    <p className={hint}>Choose your starter Pokémon.</p>
                    <ul className={options}>
                        {STARTER_NAMES.map((pokemon) => (
                            <li key={pokemon}>
                                <button
                                    type="button"
                                    className={option}
                                    onClick={() =>
                                        void encounterActions.chooseStarter(
                                            pokemon,
                                            STARTER_LOCATION_NAME,
                                        )
                                    }
                                    disabled={encounterActions.isBusy}
                                >
                                    <img
                                        className={optionIcon}
                                        src={pokemonIconSrc(
                                            toIconSlug(pokemon),
                                        )}
                                        alt={pokemon}
                                        loading="lazy"
                                    />
                                    <span>{pokemon}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                    <Button
                        variant="secondary"
                        onClick={randomizeStarter}
                        disabled={encounterActions.isBusy}
                    >
                        Randomize
                    </Button>
                </>
            )}
        </article>
    );
}

const STARTER_NAMES = ['Sprigatito', 'Fuecoco', 'Quaxly'] as const;

function randomStarter() {
    return STARTER_NAMES[Math.floor(Math.random() * STARTER_NAMES.length)];
}

const card = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--color-surface);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-md);
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
`;

const hint = css`
  margin: 0;
`;

const options = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const option = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
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

const optionIcon = css`
  width: 6.4rem;
  height: 6.4rem;
`;

const chosenBox = css`
  display: flex;
  align-items: center;
  gap: var(--space-3);
`;

const chosenIcon = css`
  width: 8rem;
  height: 8rem;
`;
