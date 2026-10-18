// global.d.ts
declare module '*.css';

interface Window {
    __analyticsEvents?: Array<{ name: string; [key: string]: unknown }>;
}
