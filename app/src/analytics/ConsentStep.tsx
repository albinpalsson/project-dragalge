import { css } from '@pokedb2/css-in-js';
import { Button } from '../components/Button';
import type { AnalyticsConsent } from './consent';

interface ConsentStepProps {
    disabled?: boolean;
    onChoice: (consent: AnalyticsConsent) => void;
}

export function ConsentStep({ disabled = false, onChoice }: ConsentStepProps) {
    return (
        <div className={content}>
            <h3>Allow optional usage analytics?</h3>
            <p>
                With your permission, PokéDB records basic app activity, such as
                page visits, game creation, and progression milestones. Game
                names and save contents are not sent. Your games stay in this
                browser either way.
            </p>
            <div className={actions}>
                <Button disabled={disabled} onClick={() => onChoice('granted')}>
                    Accept
                </Button>
                <Button
                    variant="secondary"
                    disabled={disabled}
                    onClick={() => onChoice('denied')}
                >
                    Decline
                </Button>
            </div>
        </div>
    );
}

const content = css`
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  h3,
  p {
    margin: 0;
  }

  p {
    color: var(--color-text-muted);
  }
`;

const actions = css`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
`;
