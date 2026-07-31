import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Transform } from '../main';
import { ModuleTransformCache } from '../module-transform-cache';
import { NodeModulesResolver } from '../node-modules-resolver';
import { BundlerPerformanceCollector } from '../performance-collector';
import { SCANNER_VERSION } from '../scanner/';
import { processFile } from './processor';
import { emitDeterministicEntries } from './emitter';
import type { BuildDependencyTreeResult, VisitState, ResolvedRequire } from './types';
import { isRelativeSpecifier, resolveRelativePath } from '../utils/';

const buildTransformCacheKey = (transforms: Transform[], cacheSalt?: string): string => {
  const BUNDLER_VERSION = '0.1.0';
  const transformVersions = transforms.map((transform) => transform.version);
  const parts = [BUNDLER_VERSION, `scanner:${SCANNER_VERSION}`, ...transformVersions];
  if (cacheSalt) {
    parts.push(`precompile:${cacheSalt}`);
  }
  return parts.join('|');
};

export async function buildDependencyTree(
  entryFilePath: string,
  applicationTransforms: Transform[],
  processEnv: Record<string, string | undefined>,
  cacheSalt: string,
  cacheDir: string,
  transpilationOutDir: string,
  applicationSourceRootDir: string,
  perfCollect: BundlerPerformanceCollector,
): Promise<BuildDependencyTreeResult> {
  const normalizedEntryPath = path.resolve(entryFilePath);
  const { createEnvInjectTransform } = await import('../transforms/env-inject');
  const { createMinifierTransform } = await import('../transforms/minifier');

  const transforms: Transform[] = [
    createEnvInjectTransform(processEnv),
    ...applicationTransforms,
    createMinifierTransform(),
  ];
  const cacheKey = buildTransformCacheKey(transforms, cacheSalt);
  const moduleTransformCache = await ModuleTransformCache.open({ cacheDir, cacheKey });
  const nodeModulesResolver = new NodeModulesResolver();
  const visited = new Map<string, VisitState>();

  async function visit(currentFilePath: string): Promise<void> {
    const normalizedPath = path.resolve(currentFilePath);
    const existingState = visited.get(normalizedPath);
    if (existingState) {
      return;
    }

    visited.set(normalizedPath, { status: 'pending' });

    const visitStartTime = performance.now();
    const sourceStats = await stat(normalizedPath);
    const cacheLookup = await moduleTransformCache.get(normalizedPath, {
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
    });

    let result;
    if (cacheLookup) {
      const elapsedMs = performance.now() - visitStartTime;
      perfCollect?.add('moduleTransform', path.basename(normalizedPath), elapsedMs, sourceStats.size, cacheLookup.code.length, 'cache hit');
      result = cacheLookup;
    } else {
      result = await processFile(normalizedPath, transpilationOutDir, applicationSourceRootDir, transforms, perfCollect);
      await moduleTransformCache.set(normalizedPath, result);
    }

    const module = { ...result, path: normalizedPath, requires: [] as ResolvedRequire[] };

    const uniqueDependencies = [...new Set<string>(result.dependencies)];
    const resolvedDependencies = await Promise.all(
      uniqueDependencies.map(async (specifier) => {
        const resolvedPath = isRelativeSpecifier(specifier)
          ? await resolveRelativePath(specifier, normalizedPath)
          : await nodeModulesResolver.resolve(specifier, normalizedPath);
        return { specifier, resolvedPath };
      }),
    );

    if (module.type === 'js') {
      module.requires.push(...resolvedDependencies);
    }

    visited.set(normalizedPath, { status: 'ready', entry: module });
    await Promise.all(resolvedDependencies.map((dependency) => visit(dependency.resolvedPath)));
  }

  await visit(normalizedEntryPath);

  const entries = emitDeterministicEntries(normalizedEntryPath, visited);

  for (const transform of transforms) {
    if (transform.postModuleTransform) {
      await transform.postModuleTransform({ dependencies: entries });
    }
  }

  await moduleTransformCache.finalize();
  return { entries };
}
