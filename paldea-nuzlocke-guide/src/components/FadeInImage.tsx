import { useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { css, cx } from '@project-dragalge/css-in-js';

type FadeInImageProps = Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt' | 'loading' | 'decoding'
> & {
    src: string;
    alt: string;
    /**
     * Lazy-loads, decodes off the main thread and fades in (the default).
     * Pass `false` for images in the first paint, so they show in the same
     * frame as the content around them.
     */
    lazy?: boolean;
};

// Sources that have loaded before. A remounted image is normally served from
// the browser cache, so it shows at once instead of fading in again.
const loadedSrcs = new Set<string>();

/**
 * An `<img>` that lazy-loads, decodes off the main thread and fades in once
 * loaded, so a sprite arriving late does not pop in. Callers must size the
 * image themselves so the layout does not shift while it loads.
 */
export function FadeInImage({
    src,
    alt,
    className,
    onLoad,
    lazy = true,
    ...props
}: FadeInImageProps) {
    const [loadedSrc, setLoadedSrc] = useState<string>();
    const isLoaded = loadedSrcs.has(src) || loadedSrc === src;
    const markLoaded = () => {
        loadedSrcs.add(src);
        setLoadedSrc(src);
    };

    return (
        <img
            {...props}
            className={cx(lazy && fadeIn, lazy && !isLoaded && pending, className)}
            src={src}
            alt={alt}
            loading={lazy ? 'lazy' : undefined}
            decoding={lazy ? 'async' : undefined}
            ref={(img) => {
                // A cached image can finish loading before onLoad is attached.
                if (img?.complete && img.naturalWidth > 0) {
                    markLoaded();
                }
            }}
            onLoad={(event) => {
                markLoaded();
                onLoad?.(event);
            }}
        />
    );
}

const fadeIn = css`
    transition: opacity 0.15s ease-out;

    @media (prefers-reduced-motion: reduce) {
        transition: none;
    }
`;

const pending = css`
    && {
        opacity: 0;
    }
`;
