import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Keep package-root resolution stable regardless of current working directory.
const packageRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const assetsDir = path.resolve(packageRoot, 'artifacts', 'assets');

export function assetFilePath(fileName) {
    return path.resolve(assetsDir, fileName);
}
