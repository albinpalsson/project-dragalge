import path from 'node:path';
import type { BundlerMode, BundlerTarget } from '../main.ts';
import { CompilerSession } from './compiler.ts';

export interface TranspilationResult {
    entryPath: string;
    cacheSalt: string;
    sourceRootDir: string;
    outDir: string;
    watchedFilePaths: string[];
    readEmittedFile: (filePath: string) => Promise<string>;
}

function emittedFileKey(filePath: string): string {
    const resolved = path.resolve(filePath);
    return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

export async function transpile(
    cwd: string,
    entryPath: string,
    cacheDir: string,
    target: BundlerTarget | undefined,
    mode: BundlerMode,
    compiler?: CompilerSession,
): Promise<TranspilationResult> {
    const outDir = path.resolve(cwd, cacheDir, 'tsgo-cjs');

    const session = compiler ?? new CompilerSession(cwd);
    try {
        const compilation = await session.compile({
            entryPath,
            mode,
            outDir,
            target,
        });

        const compiledEntryPath = path
            .resolve(outDir, path.basename(entryPath))
            .replace(/\.(ts|tsx|mts|cts)$/i, '.js');

        const outputFiles = new Map(
            [...compilation.outputFiles].map(([filePath, output]) => [
                emittedFileKey(filePath),
                output.text,
            ]),
        );
        const readEmittedFile = async (filePath: string): Promise<string> => {
            const text = outputFiles.get(emittedFileKey(filePath));
            if (text === undefined) {
                throw new Error(
                    `TypeScript did not emit the requested module in memory: ${filePath}`,
                );
            }
            return text;
        };
        await readEmittedFile(compiledEntryPath);

        return {
            entryPath: compiledEntryPath,
            cacheSalt: compilation.cacheSalt,
            sourceRootDir: path.dirname(entryPath),
            outDir,
            watchedFilePaths: session.getWatchedFilePaths(),
            readEmittedFile,
        };
    } finally {
        if (!compiler) {
            await session.close();
        }
    }
}
