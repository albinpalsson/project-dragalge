// global.d.ts
declare module '*.css';

// Data URI; see `inlineAssets` in bundler.config.cjs.
declare module '*.avif' {
    const src: string;
    export default src;
}

interface Window {
    __analyticsEvents?: Array<{ name: string; [key: string]: unknown }>;
}
