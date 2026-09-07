import { css } from '@pokedb2/css-in-js';
import { Button } from '../../components/Button';
import type { EncounterRollRow } from '../../db/game-db/schema';
import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import { pokemonIconSrc } from '../../pokemon-icon';
import { useAddEncounterRollMutation } from './queries';

const STARTER_NAMES = ['Sprigatito', 'Fuecoco', 'Quaxly'] as const;

interface StarterCardProps {
    gameRunId: string;
    rolls: EncounterRollRow[];
}

export function StarterCard({ gameRunId, rolls }: StarterCardProps) {
    const addRollMutation = useAddEncounterRollMutation();

    const starter = rolls.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    )?.pokemon_name;

    const choose = (pokemonName: string) => {
        addRollMutation.mutate({
            gameRunId,
            pokemonName,
            locationName: STARTER_LOCATION_NAME,
            status: 'caught',
        });
    };

    const randomize = () => {
        const pick =
            STARTER_NAMES[Math.floor(Math.random() * STARTER_NAMES.length)];
        choose(pick);
    };

    return (
        <article className={card}>
            <h3 className={heading}>Starter - Cabo poco</h3>

            {starter ? (
                <div className={chosenBox}>
                    <img
                        className={chosenIcon}
                        src={pokemonIconSrc(toSlug(starter))}
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
                                    onClick={() => choose(pokemon)}
                                    disabled={addRollMutation.isPending}
                                >
                                    <img
                                        className={optionIcon}
                                        src={pokemonIconSrc(toSlug(pokemon))}
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
                        onClick={randomize}
                        disabled={addRollMutation.isPending}
                    >
                        Randomize
                    </Button>
                </>
            )}
        </article>
    );
}

// Starter names have no form suffixes, so a plain lowercase is a valid sprite slug.
function toSlug(name: string): string {
    return name.toLowerCase();
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
