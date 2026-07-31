import path from 'node:path';
import { writeFile } from 'node:fs/promises';

import { generateRuntimeCode } from './generate-runtime.ts';
import {
  BundlerPerformanceCollector,

} from './performance-collector.ts';

import { loadResolvedConfig } from './config/index.ts';
import { transpile } from './transpile/index.ts';
import { buildDependencyTree, type DependencyEntry } from './graph/index.ts';

import {
  cleanOutputDir,
  writeMergedCssBundle,
  clearCssDependencyRuntimeSource,
  writeLinkedHtmlFile,
  compressOutputFiles,
  collectOutputFiles,
} from './output/index.ts';

import { buildWatchedFilePaths, copyPublicAssetsToOutput } from './utils/index.ts';

import type { ProgramNode } from './ast-lite/index.ts';
import { createHash } from 'node:crypto';

export type BundlerMode = 'production' | 'dev';
export type BundlerTarget = 'es6' | 'es2022';

export interface BundlerConfig {
  entry: string;
  outputDir: string;
  mode?: BundlerMode;
  target?: BundlerTarget;
  env?: Record<string, string | undefined>;
  cacheDir?: string;
  transforms?: Transform[];
}

export interface RuntimeOptions {
  entryPath: string;
}

export type ModuleTransformMetadata = Record<string, unknown>;

export interface ModuleTransformModuleRequest {
  phase: 'module';
  path: string;
  program: ProgramNode;
  metadata: ModuleTransformMetadata;
}

export interface PostModuleTransformRequest {
  dependencies: DependencyEntry[];
}

export type ModuleTransform = (request: ModuleTransformModuleRequest) => ProgramNode | Promise<ProgramNode>;

export type PostModuleTransform = (request: PostModuleTransformRequest) => void | Promise<void>;

export interface Transform {
  version: string;
  moduleTransform?: ModuleTransform;
  postModuleTransform?: PostModuleTransform;
}

interface RunBundlerOptions {
  cwd?: string;
  configFileName?: string;
  configOverrides?: Partial<BundlerConfig>;
  performance: BundlerPerformanceCollector;
}

export interface MainBundlerOptions {
  cwd?: string;
  configFileName?: string;
  configOverrides?: Partial<BundlerConfig>;
}

export interface RunBundlerResult {
  config: BundlerConfig;
  outputPath: string;
  outputCode: string;
  cssOutputPaths: string[];
  compressedOutputPaths: string[];
  watchedFilePaths: string[];
}

export type { ProcessedCssFile, ProcessedFileResult, ProcessedJsFile } from './processed-file-result.ts';

function shortContentHash(contents: string): string {
  return createHash('sha1').update(contents, 'utf8').digest('hex').slice(0, 8);
}

function isCssDependency(entry: DependencyEntry): entry is DependencyEntry & { type: 'css' } {
  return entry.type === 'css';
}

/**
 * Bundler main entry point. This function loads the configuration, builds the dependency tree, and generates the bundled output.
 */
export async function runBundler(options: RunBundlerOptions): Promise<RunBundlerResult> {
  options.performance.startBundle();
  const bundleStartTime = performance.now();

  const cwd = path.resolve(options.cwd ?? process.cwd());
  const resolvedConfig = await loadResolvedConfig(cwd, options.configFileName, options.configOverrides);

  const entryPath = path.resolve(cwd, resolvedConfig.entry);
  const outputDirPath = path.resolve(cwd, resolvedConfig.outputDir);

  await cleanOutputDir(outputDirPath);
  const publicAssets = await copyPublicAssetsToOutput(entryPath, outputDirPath);

  const transpileStartTime = performance.now();
  const transpilationResult = await transpile(cwd, entryPath, resolvedConfig.cacheDir, resolvedConfig.target, resolvedConfig.mode);
  options.performance.add('transpile', 'tsc transpile', performance.now() - transpileStartTime);

  const dependencyTree = await buildDependencyTree(entryPath,
    resolvedConfig.transforms,
    resolvedConfig.processEnv,
    transpilationResult.cacheSalt,
    resolvedConfig.cacheDir,
    transpilationResult.outDir,
    transpilationResult.sourceRootDir,
    options.performance,
  );

  const cssDependencies = dependencyTree.entries.filter(isCssDependency);
  const watchedFilePaths = await buildWatchedFilePaths(entryPath, dependencyTree.entries, publicAssets.sourceDirPath);
  const cssOutputPaths = await writeMergedCssBundle(cssDependencies, outputDirPath);
  clearCssDependencyRuntimeSource(cssDependencies);

  const bundled = generateRuntimeCode(dependencyTree.entries, { entryPath });
  const outputPath = path.resolve(outputDirPath, `${shortContentHash(bundled)}.js`);
  await writeFile(outputPath, bundled, 'utf8');

  const htmlOutputPath = await writeLinkedHtmlFile({ entryPath, outputPath, cssOutputPaths });
  const compressedOutputPaths = await compressOutputFiles({
    outputPath,
    cssOutputPaths,
    mode: resolvedConfig.mode,
  });

  const outputFiles = await collectOutputFiles({
    outputPath,
    cssOutputPaths,
    htmlOutputPath,
    compressedOutputPaths,
  });

  options.performance.bundleFinished({
    totalDurationMs: performance.now() - bundleStartTime,
    outputFiles,
  });

  return {
    config: resolvedConfig,
    outputPath,
    outputCode: bundled,
    cssOutputPaths,
    compressedOutputPaths,
    watchedFilePaths,
  };
}

export async function main(options: MainBundlerOptions = {}): Promise<void> {
  const perfCollect = new BundlerPerformanceCollector();
  await runBundler({
    ...options,
    performance: perfCollect,
  });
  perfCollect.printSummary();
}
