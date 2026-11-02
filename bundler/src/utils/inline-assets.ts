import path from 'node:path';

const MIME_TYPES: Record<string, string> = {
    '.avif': 'image/avif',
    '.gif': 'image/gif',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
};

/** Lowercases and de-duplicates the configured extensions; rejects unknown ones. */
export function normalizeInlineAssetExtensions(
    extensions: readonly string[],
): string[] {
    const normalized = new Set<string>();
    for (const extension of extensions) {
        const lower = extension.toLowerCase();
        if (!(lower in MIME_TYPES)) {
            throw new Error(
                `inlineAssets: unsupported extension "${extension}"; supported: ${Object.keys(MIME_TYPES).join(', ')}.`,
            );
        }
        normalized.add(lower);
    }
    return [...normalized].sort();
}

export function isInlineAssetPath(
    filePath: string,
    extensions: readonly string[],
): boolean {
    return extensions.includes(path.extname(filePath).toLowerCase());
}

/**
 * A CommonJS module whose default export is the file as a base64 data URI.
 * `__esModule` keeps `import src from './x.avif'` working with or without
 * TypeScript's `esModuleInterop` helpers.
 */
export function inlineAssetModuleCode(filePath: string, data: Buffer): string {
    const mimeType = MIME_TYPES[path.extname(filePath).toLowerCase()];
    return [
        'Object.defineProperty(exports,"__esModule",{value:true});',
        `exports.default=${JSON.stringify(`data:${mimeType};base64,${data.toString('base64')}`)};`,
    ].join('\n');
}
