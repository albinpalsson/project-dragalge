import { css, cx } from '@project-dragalge/css-in-js';
import { Button } from '../../components/Button';
import { CollapseButton } from '../../components/CollapseButton';
import { CollapsedSummaryRow } from '../../components/CollapsedSummaryRow';
import { PokemonIcon } from '../../components/PokemonIcon';
import { ProgressionCard } from '../../components/ProgressionCard';
import { collapseOnHeaderClick } from '../../components/ProgressionCardHeader';
import { RandomizeButton } from '../../components/RandomizeButton';
import { StatusChip } from '../../components/StatusChip';
import { getPokemonTypeColor } from '../../utils/pokemon-type-colors';

import { STARTER_LOCATION_NAME } from '../../db/game-db/queries';
import { useEncounterActions } from '../../hooks/useEncounterActions';
import { useStarter } from '../../hooks/useStarter';
import { STARTER_CHOICES } from '../../utils/starter-choices';
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

    const availableStarterChoices = STARTER_CHOICES.filter(
        (choice) => !game.getBanReason(choice.name, { ignoreMonoRun: true }),
    );

    const randomizeStarter = () => {
        const pick = randomStarter(availableStarterChoices);
        if (!pick) {
            return;
        }
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
    const starterBorderColor = getStarterIconBorderColor(
        starterChoice?.type ?? '',
    );
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
                                  <PokemonIcon
                                      name={starter}
                                      size="sm"
                                      zoomed
                                      borderColor={starterBorderColor}
                                  />
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
                    {/* biome-ignore lint/a11y/noStaticElementInteractions lint/a11y/useKeyWithClickEvents: pointer shortcut; the collapse button is the keyboard and screen-reader path */}
                    <div
                        className={cx(headingRow, starter && clickableRow)}
                        onClick={
                            starter ? collapseOnHeaderClick(collapse) : undefined
                        }
                    >
                        <h3 className={heading}>Starter - Cabo poco</h3>
                        {starter && (
                            <CollapseButton
                                onClick={collapse}
                                label="Collapse starter"
                            />
                        )}
                    </div>

                    {starter ? (
                        <div className={chosenBox}>
                            <span className={chosenTopRow}>
                                <PokemonIcon
                                    name={starter}
                                    size="xl"
                                    zoomed
                                    borderColor={starterBorderColor}
                                />
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
                                {STARTER_CHOICES.map((starterChoice) => {
                                    const banReason = game.getBanReason(
                                        starterChoice.name,
                                        { ignoreMonoRun: true },
                                    );
                                    return (
                                        <li key={starterChoice.name}>
                                            <button
                                                type="button"
                                                className={cx(
                                                    option,
                                                    banReason && blockedOption,
                                                )}
                                                onClick={() =>
                                                    void encounterActions.chooseStarter(
                                                        starterChoice.name,
                                                        STARTER_LOCATION_NAME,
                                                    )
                                                }
                                                title={
                                                    banReason
                                                        ? `Blocked: ${banReason}`
                                                        : undefined
                                                }
                                                disabled={isBusy || !!banReason}
                                            >
                                                <PokemonIcon
                                                    name={starterChoice.name}
                                                    size="option"
                                                    zoomed
                                                    borderColor={getStarterIconBorderColor(
                                                        starterChoice.type,
                                                    )}
                                                />
                                                <span
                                                    className={
                                                        banReason
                                                            ? excludedName
                                                            : undefined
                                                    }
                                                >
                                                    {starterChoice.name}
                                                </span>
                                                {banReason && (
                                                    <span
                                                        className={
                                                            exclusionReason
                                                        }
                                                    >
                                                        {banReason}
                                                    </span>
                                                )}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                            <div className={actionRow}>
                                <RandomizeButton
                                    label="Randomize"
                                    variant="warm"
                                    disabled={
                                        isBusy ||
                                        availableStarterChoices.length === 0
                                    }
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

function getStarterIconBorderColor(type: string): string {
    return `color-mix(in srgb, ${getPokemonTypeColor(type)} 70%, var(--color-surface))`;
}

function starterChoiceForName(name: string) {
    return STARTER_CHOICES.find((starterChoice) => starterChoice.name === name);
}

function randomStarter(choices: readonly (typeof STARTER_CHOICES)[number][]) {
    if (choices.length === 0) {
        return undefined;
    }
    return choices[Math.floor(Math.random() * choices.length)].name;
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

const clickableRow = css`
    cursor: pointer;
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
    position: relative;
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

    &:disabled {
        cursor: not-allowed;
    }
`;

const blockedOption = css`
        opacity: 0.62;

        > * {
                filter: grayscale(0.35);
        }
`;

const excludedName = css`
    text-decoration: line-through;
`;

const exclusionReason = css`
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
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
