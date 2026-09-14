import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CollapsedSummaryRow } from '../../components/CollapsedSummaryRow';
import { ProgressionCard } from '../../components/ProgressionCard';
import { StatusChip } from '../../components/StatusChip';
import { pokemonIconSrc, toIconSlug } from '../../pokemon-icon';

import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import { useEncounterActions } from '../../hooks/useEncounterActions';
import { useStarter } from '../../hooks/useStarter';

interface StarterCardProps {
    isNext?: boolean;
}

export function StarterCard({ isNext }: StarterCardProps) {
    const encounterActions = useEncounterActions();
    const starter = useStarter();

    const randomizeStarter = () => {
        const pick = randomStarter();
        void encounterActions.chooseStarter(pick, STARTER_LOCATION_NAME);
    };

    return (
        <ProgressionCard
            isNext={isNext}
            defaultExpanded={!starter}
            expandWhen={!starter}
            collapsedContent={
                starter
                    ? ({ expand }) => (
                          <CollapsedSummaryRow
                              icon={
                                  <img
                                      className={summaryIcon}
                                      src={pokemonIconSrc(toIconSlug(starter))}
                                      alt={starter}
                                      loading="lazy"
                                  />
                              }
                              label="Starter - Cabo poco"
                              title={starter}
                              leftBadges={<StatusChip status="caught" />}
                              isNext={isNext}
                              onExpand={expand}
                          />
                      )
                    : undefined
            }
        >
            {({ collapse }) => (
                <>
                    <div className={headingRow}>
                        <h3 className={heading}>Starter - Cabo poco</h3>
                        {starter && (
                            <BadgeButton
                                onClick={collapse}
                                ariaLabel="Collapse starter"
                                title="Collapse starter"
                            >
                                ▾ Fold
                            </BadgeButton>
                        )}
                    </div>

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
                                variant="warm"
                                onClick={randomizeStarter}
                                disabled={encounterActions.isBusy}
                            >
                                Randomize
                            </Button>
                        </>
                    )}
                </>
            )}
        </ProgressionCard>
    );
}

const STARTER_NAMES = ['Sprigatito', 'Fuecoco', 'Quaxly'] as const;

function randomStarter() {
    return STARTER_NAMES[Math.floor(Math.random() * STARTER_NAMES.length)];
}

const heading = css`
  margin: 0;
  font-size: var(--font-size-base);
  color: var(--color-text-muted);
`;

const headingRow = css`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: var(--space-2);
`;

const hint = css`
  margin: 0;
  color: var(--color-text-secondary);
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

const summaryIcon = css`
    width: 3.2rem;
    height: 3.2rem;
`;
