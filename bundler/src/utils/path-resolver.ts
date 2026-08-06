import path from 'node:path';
import { pathExists } from '../node-modules-resolver.ts';

export async function resolveRelativePath(
    specifier: string,
    fromFilePath: string,
): Promise<string> {
    const fromDir = path.dirname(fromFilePath);
    const basePath = path.resolve(fromDir, specifier);
    const hasExtension = path.extname(basePath).length > 0;

    const candidates = hasExtension
        ? [basePath]
        : [
              basePath,
              `${basePath}.ts`,
              `${basePath}.tsx`,
              `${basePath}.mts`,
              `${basePath}.cts`,
              `${basePath}.js`,
              `${basePath}.jsx`,
              path.join(basePath, 'index.ts'),
              path.join(basePath, 'index.tsx'),
              path.join(basePath, 'index.js'),
              path.join(basePath, 'index.jsx'),
          ];

    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }

    throw new Error(
        `Unable to resolve dependency "${specifier}" from ${fromFilePath}`,
    );
}
