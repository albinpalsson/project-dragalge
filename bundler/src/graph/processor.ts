import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseProgram, writeProgram } from '../ast-lite/';
import type { Transform, ModuleTransformMetadata } from '../main';
import type { ProcessedFileResult } from '../processed-file-result';
import { BundlerPerformanceCollector } from '../performance-collector';
import { findDependencies } from './parser';
import { isCssFilePath, extractAdditionalImports } from '../utils/';

export async function processFile(
  filePath: string,
  transpilationDir: string,
  applicationSourceRootDir: string,
  transforms: Transform[],
  perfCollect: BundlerPerformanceCollector | undefined,
): Promise<ProcessedFileResult> {
  const code = await readFile(filePath, 'utf8');
  if (isCssFilePath(filePath)) {
    perfCollect?.add('moduleTransform', path.basename(filePath), 0, code.length, code.length);
    return { type: 'css', code, dependencies: [] };
  }
  const cjs = await resolveCjsFile(filePath, transpilationDir, applicationSourceRootDir);

  const t0 = performance.now();
  const { ast, metadata } = await applyModuleTransforms(cjs.path, cjs.code, transforms);
  const dependencies = findDependencies(ast.body).map((dep) => dep.specifier);
  const processedCode = writeProgram(ast);

  if (filePath.startsWith(applicationSourceRootDir)) {
    for (const sourceDep of extractAdditionalImports(await readFile(filePath, 'utf8'))) {
      dependencies.push(sourceDep);
    }
  }

  const elapsedMs = performance.now() - t0;
  perfCollect?.add('moduleTransform', path.basename(filePath), elapsedMs, code.length, processedCode.length);

  return { type: 'js', code: processedCode, dependencies: Array.from(dependencies), metadata };
}

async function resolveCjsFile(
  filePath: string,
  transpilationDir: string,
  applicationSourceRootDir: string,
): Promise<{ path: string; code: string }> {
  const relativeToSourceRoot = path.relative(applicationSourceRootDir, filePath);
  const isApplicationFile = !relativeToSourceRoot.startsWith('..') && !path.isAbsolute(relativeToSourceRoot);

  if (isApplicationFile) {
    const transpiledPath = path
      .resolve(transpilationDir, relativeToSourceRoot)
      .replace(/\.(ts|tsx|mts|cts)$/i, '.js');
    const code = await readFile(transpiledPath, 'utf8');
    return { path: transpiledPath, code };
  }

  const code = await readFile(filePath, 'utf8');
  return { path: filePath, code };
}

export async function applyModuleTransforms(
  modulePath: string,
  code: string,
  transforms: Transform[],
) {
  let ast = parseProgram(code);
  const metadata: ModuleTransformMetadata = {};

  for (const transform of transforms) {
    if (transform.moduleTransform) {
      ast = await transform.moduleTransform({
        phase: 'module',
        path: modulePath,
        program: ast,
        metadata,
      });
    }
  }

  return { ast, metadata };
}
