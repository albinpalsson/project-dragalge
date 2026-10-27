import { css } from '@project-dragalge/css-in-js';
import { RandomizerModesGuide } from '../components/RandomizerModesGuide';

export function RandomizerModes() {
    return (
        <section className={page}>
            <h2>Randomizer modes</h2>
            <RandomizerModesGuide />
        </section>
    );
}

const page = css`
    width: 100%;

    h2 {
        margin: 0 0 var(--space-4);
    }
`;
