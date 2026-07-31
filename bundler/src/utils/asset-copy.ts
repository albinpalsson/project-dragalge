import { copyFile, mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

export async function copyPublicAssetsToOutput(entryPath: string, outputDirPath: string) {
  const { pathExists } = await import('../node-modules-resolver.ts');

  const sourceDirPath = path.resolve(path.dirname(entryPath), '..', 'public');

  if (!(await pathExists(sourceDirPath))) {
    return { sourceDirPath };
  }

  await copyDirectoryRecursive(sourceDirPath, outputDirPath);
  return { sourceDirPath };
}

export async function copyDirectoryRecursive(sourceDirPath: string, targetDirPath: string): Promise<void> {
  await mkdir(targetDirPath, { recursive: true });
  const entries = await readdir(sourceDirPath, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.resolve(sourceDirPath, entry.name);
    const targetPath = path.resolve(targetDirPath, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursive(sourcePath, targetPath);
      continue;
    }

    if (!entry.isFile()) {
      continue;
    }

    await copyFile(sourcePath, targetPath);
  }
}
