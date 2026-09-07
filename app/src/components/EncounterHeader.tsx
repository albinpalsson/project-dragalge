import { css } from '@pokedb2/css-in-js';
import type { LocationEncounterDetails } from '../db/pokemon-data/queries';
import type { LocationEncounterView } from '../db/pokemon-data/queries';

interface EncounterHeaderProps {
    location: LocationEncounterDetails['location'];
    encounters: LocationEncounterView[];
}

export function EncounterHeader({
    location,
    encounters,
}: EncounterHeaderProps) {
    const levelRange = getLevelRange(encounters);

    return (
        <header className={header}>
            <div>
                <h3 className={heading}>{location.name}</h3>
                <p className={subheading}>{location.region}</p>
            </div>
            <div className={badges}>
                <span className={badge}>{location.province}</span>
                {levelRange && (
                    <span className={badge}>
                        Lv {levelRange.min}-{levelRange.max}
                    </span>
                )}
                <span className={badge}>{encounters.length} encounters</span>
            </div>
        </header>
    );
}

function getLevelRange(encounters: LocationEncounterView[]) {
    if (encounters.length === 0) {
        return undefined;
    }
    return {
        min: Math.min(...encounters.map((encounter) => encounter.minLevel)),
        max: Math.max(...encounters.map((encounter) => encounter.maxLevel)),
    };
}

const header = css`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-3);
`;

const heading = css`
  margin: 0;
  font-size: var(--font-size-lg);
`;

const subheading = css`
  margin: var(--space-1) 0 0;
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;

const badges = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-1);
`;

const badge = css`
  padding: var(--space-1) var(--space-2);
  border: 0.1rem solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-size: var(--font-size-sm);
`;
