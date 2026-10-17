import { css } from '@pokedb2/css-in-js';
import { formatLocationName } from '../../../../utils/encounter-formatters';

interface StrongTrainerIdentityProps {
    displayName: string;
    locationName: string;
}

export function StrongTrainerIdentity({
    displayName,
    locationName,
}: StrongTrainerIdentityProps) {
    return (
        <div>
            <div className={titleRow}>
                <h3 className={title}>{displayName}</h3>
            </div>
            <p className={locationText}>{formatLocationName(locationName)}</p>
        </div>
    );
}

const titleRow = css`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
`;

const title = css`
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: 600;
`;

const locationText = css`
    margin: var(--space-1) 0 0;
    color: var(--color-text-muted);
    font-size: var(--font-size-sm);
`;
