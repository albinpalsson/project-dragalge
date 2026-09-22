import { css } from '@pokedb2/css-in-js';
import { BadgeButton } from '../../components/Badge';
import { Button } from '../../components/Button';
import { CollapsedSummaryRow } from '../../components/CollapsedSummaryRow';
import { ProgressionCard } from '../../components/ProgressionCard';
import { RandomizeButton } from '../../components/RandomizeButton';
import { StatusChip } from '../../components/StatusChip';
import { pokemonIconSrc, toIconSlug } from '../../pokemon-icon';
import { getPokemonTypeColor } from '../../utils/pokemon-type-colors';

import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import { useEncounterActions } from '../../hooks/useEncounterActions';
import { useStarter } from '../../hooks/useStarter';
import { useGame } from './GameContext';
import { useClearEncounterRollMutation } from './queries';

interface StarterCardProps {
    isNext?: boolean;
}

export function StarterCard({ isNext }: StarterCardProps) {
    const game = useGame();
    const encounterActions = useEncounterActions();
    const clearStarterMutation = useClearEncounterRollMutation();
    const starter = useStarter();
    const isBusy = encounterActions.isBusy || clearStarterMutation.isPending;

    if (starter === undefined) {
        return null;
    }

    const randomizeStarter = () => {
        const pick = randomStarter();
        void encounterActions.chooseStarter(pick, STARTER_LOCATION_NAME);
    };

    const resetStarter = () => {
        void clearStarterMutation.mutateAsync({
            gameRunId: game.id,
            locationName: STARTER_LOCATION_NAME,
        });
    };

    const toggleStarterEliminated = () => {
        if (starterStatus === 'eliminated') {
            void encounterActions.catchEncounter(STARTER_LOCATION_NAME);
            return;
        }
        void encounterActions.eliminateEncounter(STARTER_LOCATION_NAME);
    };

    const starterChoice = starterChoiceForName(starter ?? '');
    const starterBorderColor = getPokemonTypeColor(starterChoice?.type ?? '');
    const starterRow = game.encounters.find(
        (row) => row.location_name === STARTER_LOCATION_NAME,
    );
    const starterStatus = starterRow?.status ?? 'caught';

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
                                  <span
                                      className={summaryIconFrame}
                                      style={{
                                          borderColor: starterBorderColor,
                                      }}
                                  >
                                      <img
                                          className={summaryIcon}
                                          src={pokemonIconSrc(
                                              toIconSlug(starter),
                                          )}
                                          alt={starter}
                                          loading="lazy"
                                      />
                                  </span>
                              }
                              label="Starter - Cabo poco"
                              title={starter}
                              leftBadges={
                                  <StatusChip
                                      status={starterStatus}
                                      labels={{ caught: 'Selected' }}
                                  />
                              }
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
                            <span className={chosenTopRow}>
                                <span
                                    className={iconFrameLarge}
                                    style={{
                                        borderColor: starterBorderColor,
                                    }}
                                >
                                    <img
                                        className={chosenIcon}
                                        src={pokemonIconSrc(
                                            toIconSlug(starter),
                                        )}
                                        alt={starter}
                                        loading="lazy"
                                    />
                                </span>
                                <span className={chosenDetails}>
                                    <span className={chosenIdentity}>
                                        <span className={chosenName}>
                                            {starter}
                                        </span>
                                        <StatusChip
                                            status={starterStatus}
                                            labels={{ caught: 'Selected' }}
                                        />
                                    </span>
                                    <span className={chosenTopActions}>
                                        <Button
                                            variant="secondary"
                                            disabled={isBusy}
                                            onClick={resetStarter}
                                            ariaLabel="Reset starter choice"
                                            title="Reset starter choice"
                                        >
                                            ↺
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            className={
                                                starterStatus !== 'eliminated'
                                                    ? eliminatedButtonInactive
                                                    : undefined
                                            }
                                            ariaLabel="Eliminated"
                                            title="Eliminated"
                                            onClick={toggleStarterEliminated}
                                            disabled={isBusy}
                                        >
                                            💀
                                        </Button>
                                    </span>
                                </span>
                            </span>
                            <span className={chosenActions}>
                                <RandomizeButton
                                    label="Re-roll"
                                    variant="secondary"
                                    disabled={isBusy}
                                    onRandomize={randomizeStarter}
                                    ariaLabel="Re-roll starter"
                                    title="Re-roll starter"
                                />
                            </span>
                        </div>
                    ) : (
                        <>
                            <p className={hint}>Choose your starter Pokémon.</p>
                            <ul className={options}>
                                {STARTER_CHOICES.map((starterChoice) => (
                                    <li key={starterChoice.name}>
                                        <button
                                            type="button"
                                            className={option}
                                            onClick={() =>
                                                void encounterActions.chooseStarter(
                                                    starterChoice.name,
                                                    STARTER_LOCATION_NAME,
                                                )
                                            }
                                            disabled={isBusy}
                                        >
                                            <span
                                                className={iconFrameSmall}
                                                style={{
                                                    borderColor:
                                                        getPokemonTypeColor(
                                                            starterChoice.type,
                                                        ),
                                                }}
                                            >
                                                <img
                                                    className={optionIcon}
                                                    src={pokemonIconSrc(
                                                        toIconSlug(
                                                            starterChoice.name,
                                                        ),
                                                    )}
                                                    alt={starterChoice.name}
                                                    loading="lazy"
                                                />
                                            </span>
                                            <span>{starterChoice.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                            <div className={actionRow}>
                                <RandomizeButton
                                    label="Randomize"
                                    variant="warm"
                                    disabled={isBusy}
                                    onRandomize={randomizeStarter}
                                    ariaLabel="Randomize"
                                    title="Randomize"
                                />
                            </div>
                        </>
                    )}
                </>
            )}
        </ProgressionCard>
    );
}

const STARTER_CHOICES = [
    { name: 'Sprigatito', type: 'Grass' },
    { name: 'Fuecoco', type: 'Fire' },
    { name: 'Quaxly', type: 'Water' },
] as const;

function starterChoiceForName(name: string) {
    return STARTER_CHOICES.find((starterChoice) => starterChoice.name === name);
}

export const STARTER_NAMES = STARTER_CHOICES.map(
    (starterChoice) => starterChoice.name,
) as [
    (typeof STARTER_CHOICES)[0]['name'],
    (typeof STARTER_CHOICES)[1]['name'],
    (typeof STARTER_CHOICES)[2]['name'],
];

function randomStarter() {
    return STARTER_NAMES[Math.floor(Math.random() * STARTER_NAMES.length)];
}

const heading = css`
  margin: 0;
    font-size: var(--font-size-lg);
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

const actionRow = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
`;

const option = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  padding: var(--space-2);
  border-width: 0rem;
  background: transparent;
  color: var(--color-text);
  font-size: var(--font-size-base);
  cursor: pointer;

  &:hover {
    background: var(--color-hover-overlay);
  }
`;

const optionIcon = css`
    width: 100%;
    height: 100%;
    transform: translateY(
            calc(-1 * (var(--starter-icon-pad-top) + 0.08rem))
        )
        scale(1.24);
    transform-origin: center bottom;
`;

const iconFrameSmall = css`
    width: 6.4rem;
    height: 6.4rem;
    --starter-icon-pad-x: 0.3rem;
    --starter-icon-pad-top: 0.24rem;
    --starter-icon-pad-bottom: 0.4rem;
    padding: var(--starter-icon-pad-top) var(--starter-icon-pad-x)
        var(--starter-icon-pad-bottom) var(--starter-icon-pad-x);
    border: 0.1rem solid currentColor;
    border-radius: var(--radius-sm);
    overflow: hidden;
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;
`;

const chosenBox = css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
`;

const chosenTopRow = css`
    display: flex;
    align-items: flex-end;
    gap: var(--space-3);
    flex-wrap: wrap;
`;

const chosenDetails = css`
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-2);
`;

const chosenTopActions = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
`;

const chosenActions = css`
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
`;

const chosenIcon = css`
    width: 100%;
    height: 100%;
    transform: translateY(
            calc(-1 * (var(--starter-icon-pad-top) + 0.08rem))
        )
        scale(1.17);
    transform-origin: center bottom;
`;

const iconFrameLarge = css`
    width: 8rem;
    height: 8rem;
    --starter-icon-pad-x: 0.3rem;
    --starter-icon-pad-top: 0.24rem;
    --starter-icon-pad-bottom: 0.4rem;
    padding: var(--starter-icon-pad-top) var(--starter-icon-pad-x)
        var(--starter-icon-pad-bottom) var(--starter-icon-pad-x);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;
`;

const chosenName = css`
    font-weight: var(--font-weight-bold);
`;

const chosenIdentity = css`
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
`;

const eliminatedButtonInactive = css`
    opacity: 0.7;
`;

const summaryIcon = css`
    width: 100%;
    height: 100%;
    transform: translateY(
            calc(-1 * (var(--starter-icon-pad-top) + 0.04rem))
        )
        scale(1.17);
    transform-origin: center bottom;
`;

const summaryIconFrame = css`
    width: 3.2rem;
    height: 3.2rem;
    --starter-icon-pad-x: 0.12rem;
    --starter-icon-pad-top: 0.08rem;
    --starter-icon-pad-bottom: 0.18rem;
    padding: var(--starter-icon-pad-top) var(--starter-icon-pad-x)
        var(--starter-icon-pad-bottom) var(--starter-icon-pad-x);
    border: 0.1rem solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow: hidden;
    display: inline-flex;
    align-items: flex-end;
    justify-content: center;
`;
