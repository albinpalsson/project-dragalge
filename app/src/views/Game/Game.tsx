import { css } from '@pokedb2/css-in-js';
import { useCaughtPokemonQuery } from './queries';
import { StarterCard } from './StarterCard';

interface GameProps {
    gameRunId: string;
}

export function Game({ gameRunId }: GameProps) {
    const caught = useCaughtPokemonQuery(gameRunId);

    return (
        <section>
            <h2>{gameRunId}</h2>
            {caught.isPending && <p className={mutedText}>Loading...</p>}
            {caught.isError && <p className={mutedText}>Error loading caught Pokémon. {caught.error?.message}</p>}
            {caught.isSuccess && (
                <ol className={cardList}>
                    <li>
                        <StarterCard
                            gameRunId={gameRunId}
                            caught={caught.data ?? []}
                        />
                    </li>
                </ol>
            )}
        </section>
    );
}

const cardList = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  list-style: none;
  margin: 0;
  padding: 0;
`;

const mutedText = css`
  color: var(--color-text-muted);
`;
