import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

export async function copyPublicAssetsToOutput(
    entryPath: string,
    outputDirPath: string,
) {
    const { pathExists } = await import('../node-modules-resolver.ts');

    const sourceDirPath = path.resolve(path.dirname(entryPath), '..', 'public');

    if (!(await pathExists(sourceDirPath))) {
        return { sourceDirPath, copiedSizeBytes: 0 };
    }

    const copiedSizeBytes = await copyDirectoryRecursive(
        sourceDirPath,
        outputDirPath,
    );
    return { sourceDirPath, copiedSizeBytes };
}

export async function copyDirectoryRecursive(
    sourceDirPath: string,
    targetDirPath: string,
): Promise<number> {
    await mkdir(targetDirPath, { recursive: true });
    const entries = await readdir(sourceDirPath, { withFileTypes: true });
    const copiedSizes = await Promise.all(
        entries.map(async (entry) => {
            const sourcePath = path.resolve(sourceDirPath, entry.name);
            const targetPath = path.resolve(targetDirPath, entry.name);

            if (entry.isDirectory()) {
                return copyDirectoryRecursive(sourcePath, targetPath);
            }

            if (!entry.isFile()) {
                return 0;
            }

            await copyFile(sourcePath, targetPath);
            return (await stat(targetPath)).size;
        }),
    );

    return copiedSizes.reduce((total, size) => total + size, 0);
}
