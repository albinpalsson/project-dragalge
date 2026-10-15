import { css } from '@pokedb2/css-in-js';

export const progressionCardPattern = css`
    && {
        background-image: repeating-linear-gradient(
            45deg,
            color-mix(
                in srgb,
                var(--progression-card-pattern-color) 9%,
                var(--color-surface)
            ),
            color-mix(
                in srgb,
                var(--progression-card-pattern-color) 9%,
                var(--color-surface)
            ) 0.6rem,
            color-mix(
                in srgb,
                var(--progression-card-pattern-color) 4%,
                var(--color-surface)
            ) 0.6rem,
            color-mix(
                in srgb,
                var(--progression-card-pattern-color) 4%,
                var(--color-surface)
            ) 1.2rem
        );
    }
`;
