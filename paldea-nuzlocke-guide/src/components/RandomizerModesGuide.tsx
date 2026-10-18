import { css, cx } from '@project-dragalge/css-in-js';
import {
    getEncounterOdds,
    RANDOMIZER_MODE_OPTIONS,
    type RandomizableEncounter,
} from '../randomizer';

export function RandomizerModesGuide() {
    const results = getEncounterOdds(EXAMPLE_ENCOUNTERS, 'weighted').map(
        (odds) => odds.pokemonName,
    );
    const chanceByMode = RANDOMIZER_MODE_OPTIONS.map(
        (mode) =>
            new Map(
                getEncounterOdds(EXAMPLE_ENCOUNTERS, mode.value).map((odds) => [
                    odds.pokemonName,
                    odds.chance,
                ]),
            ),
    );

    return (
        <div className={guide}>
            <p className={text}>
                Every area has an encounter table with a spawn rate for each
                Pokémon. The randomizer mode decides how those spawn rates turn
                into your chance of rolling each Pokémon.
            </p>
            <dl className={modeList}>
                {RANDOMIZER_MODE_OPTIONS.map((mode) => (
                    <div key={mode.value}>
                        <dt className={modeName}>{mode.label}</dt>
                        <dd className={text}>{mode.description}</dd>
                    </div>
                ))}
            </dl>

            <h4 className={tableHeading}>Example encounter table</h4>
            <table
                className={cx(table, stripedRows)}
                aria-label="Example encounter table"
            >
                <thead>
                    <tr>
                        <th>Pokémon</th>
                        <th>Sub-area</th>
                        <th>Spawn rate</th>
                    </tr>
                </thead>
                <tbody>
                    {EXAMPLE_ENCOUNTERS.map((encounter) => (
                        <tr key={`${encounter.name}-${encounter.subArea}`}>
                            <td>{encounter.name}</td>
                            <td>{encounter.subArea}</td>
                            <td>{encounter.dayRate}%</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h4 className={tableHeading}>Chance to roll each result</h4>
            <table className={table} aria-label="Randomizer odds">
                <thead>
                    <tr>
                        <th>Result</th>
                        {RANDOMIZER_MODE_OPTIONS.map((mode) => (
                            <th key={mode.value}>{mode.shortLabel}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {results.map((name) => (
                        <tr key={name}>
                            <td>{name}</td>
                            {chanceByMode.map((chances, index) => {
                                const percent = (chances.get(name) ?? 0) * 100;
                                return (
                                    <td
                                        key={
                                            RANDOMIZER_MODE_OPTIONS[index].value
                                        }
                                        className={
                                            getOddsLevel(percent).className
                                        }
                                    >
                                        {percent.toFixed(1)}%
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
            <ul className={legend} aria-label="Odds legend">
                {ODDS_LEVELS.map((level) => (
                    <li key={level.label} className={level.className}>
                        {level.label}
                    </li>
                ))}
            </ul>
        </div>
    );
}

interface ExampleEncounter extends RandomizableEncounter {
    subArea: string;
}

function example(
    name: string,
    subArea: string,
    spawnRate: number,
): ExampleEncounter {
    return {
        name,
        subArea,
        morningRate: spawnRate,
        dayRate: spawnRate,
        eveningRate: spawnRate,
        nightRate: spawnRate,
    };
}

const EXAMPLE_ENCOUNTERS: readonly ExampleEncounter[] = [
    example('Lechonk', 'Prairie', 80),
    example('Buizel', 'Water', 40),
    example('Flabébé (Red Flower)', 'Flower', 16),
    example('Flabébé (Yellow Flower)', 'Flower', 16),
    example('Pawmi', 'Prairie', 10),
    example('Wingull', 'Beach', 10),
    example('Wingull', 'Water', 10),
    example('Ralts', 'Prairie', 2),
];

const rareCell = css`
  background: var(--color-warning-bg);
`;

const commonCell = css`
  background: var(--color-success-bg);
`;

const veryLikelyCell = css`
  background: var(--color-info-bg);
`;

// Ordered from rarest; each level covers chances below its `below` percentage.
const ODDS_LEVELS = [
    { below: 10, label: 'Rare', className: rareCell },
    { below: 20, label: 'Common', className: commonCell },
    {
        below: Number.POSITIVE_INFINITY,
        label: 'Very likely',
        className: veryLikelyCell,
    },
] as const;

function getOddsLevel(percent: number) {
    return (
        ODDS_LEVELS.find((level) => percent < level.below) ??
        ODDS_LEVELS[ODDS_LEVELS.length - 1]
    );
}

const guide = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
`;

const text = css`
  margin: 0;
  color: var(--color-text-secondary);
`;

const modeList = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin: 0;

  dd {
    margin: 0;
  }
`;

const modeName = css`
  font-weight: var(--font-weight-bold);
`;

const tableHeading = css`
  margin: 0;
`;

const table = css`
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th,
  td {
    padding: var(--space-1) var(--space-2);
    border-bottom: 0.1rem solid var(--color-border);
    text-align: left;
  }

  th {
    color: var(--color-text-muted);
    font-weight: var(--font-weight-bold);
  }
`;

const stripedRows = css`
    tbody tr:nth-child(odd) {
        background: var(--color-surface-alt);
    }
`;

const legend = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--font-size-sm);

  li {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-sm);
  }
`;
