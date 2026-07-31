import { mkdir, stat } from 'node:fs/promises';
import path from 'node:path';
import type { BundlerTarget, BundlerMode } from '../main';
import { buildTranspileArgs, runCommand } from './compiler';

export async function transpile(
  cwd: string,
  entryPath: string,
  cacheDir: string,
  target: BundlerTarget | undefined,
  mode: BundlerMode,
): Promise<{ entryPath: string; cacheSalt: string; sourceRootDir: string; outDir: string }> {
  const outDir = path.resolve(cwd, cacheDir, 'tsgo-cjs');

  await mkdir(outDir, { recursive: true });
  const compileArgs = buildTranspileArgs({
    entryPath,
    mode,
    outDir,
    target,
  });
  const out = await runCommand('tsc', compileArgs, cwd);
  if (out.stderr || out.stdout) {
    console.log(out);
  }

  const relativeEntry = path.relative(path.dirname(entryPath), entryPath);
  const compiledEntryPath = path.resolve(outDir, relativeEntry).replace(/\.(ts|tsx|mts|cts)$/i, '.js');

  try {
    await stat(compiledEntryPath);
  } catch {
    throw new Error(`Transpilation succeeded but compiled entry was not found: ${compiledEntryPath}`);
  }

  return {
    entryPath: compiledEntryPath,
    cacheSalt: ['tsc', ...compileArgs].join(' '),
    sourceRootDir: path.dirname(entryPath),
    outDir,
  };
}
