import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { ProcessedFileResult, ProcessedFileResultRef } from './processed-file-result.ts';
import { assert } from './assert.ts';

const MODULE_TRANSFORM_CACHE_VERSION = 4;

export interface SourceFingerprint {
  sourceMtimeMs: number;
  sourceSize: number;
}

type ModuleTransformCacheEntry = {
  fingerprint: SourceFingerprint;
} & ProcessedFileResultRef;

type ModuleTransformCacheIndexEntry = {
  fingerprint: SourceFingerprint;
} & ProcessedFileResultRef;

interface ModuleTransformCacheIndex {
  version: typeof MODULE_TRANSFORM_CACHE_VERSION;
  cacheKey: string;
  entries: Record<string, ModuleTransformCacheIndexEntry>;
}

export class ModuleTransformCache {
  private readonly indexFilePath: string;
  private readonly payloadDirPath: string;
  private readonly cacheKey: string;
  private readonly usedPathsThisRun = new Set<string>();
  private readonly entriesByPath: Record<string, ModuleTransformCacheEntry>;
  private readonly loadedPayloads: Map<string, string> = new Map();

  private constructor(
    indexFilePath: string,
    payloadDirPath: string,
    cacheKey: string,
    entriesByPath: Record<string, ModuleTransformCacheEntry>,
  ) {
    this.indexFilePath = indexFilePath;
    this.payloadDirPath = payloadDirPath;
    this.cacheKey = cacheKey;
    this.entriesByPath = entriesByPath;
  }

  static async open(input: { cacheDir: string; cacheKey: string }): Promise<ModuleTransformCache> {
    const indexFilePath = path.resolve(input.cacheDir, 'module-transform-cache.json');
    const payloadDirPath = path.resolve(input.cacheDir, 'module-transform-payloads');
    const entriesByPath = await loadIndexEntries(indexFilePath, input.cacheKey);
    return new ModuleTransformCache(indexFilePath, payloadDirPath, input.cacheKey, entriesByPath);
  }

  async get(modulePath: string, fingerprint: SourceFingerprint): Promise<ProcessedFileResult | null> {
    const entry = this.entriesByPath[modulePath];
    if (!entry) {
      return null;
    }

    const matchesFingerprint = entry.fingerprint.sourceMtimeMs === fingerprint.sourceMtimeMs
      && entry.fingerprint.sourceSize === fingerprint.sourceSize;
    if (!matchesFingerprint) {
      return null;
    }

    this.usedPathsThisRun.add(modulePath);

    let code = this.loadedPayloads.get(modulePath);
    if (!code) {
        code = await readFile(path.resolve(this.payloadDirPath, entry.payloadFileName), 'utf8');
        this.loadedPayloads.set(modulePath, code);
    }
    return { ...entry, code };
  }

  async set(modulePath: string, value: ProcessedFileResult): Promise<void> {
    this.usedPathsThisRun.add(modulePath);
    const sourceStats = await stat(modulePath);
    const fingerprint = {
      sourceMtimeMs: sourceStats.mtimeMs,
      sourceSize: sourceStats.size,
    };
    const payloadFileName = buildPayloadFileName(modulePath, fingerprint.sourceMtimeMs, fingerprint.sourceSize);

    this.entriesByPath[modulePath] = {
      fingerprint,
      payloadFileName,
      ...value,
    };
    this.loadedPayloads.set(modulePath, value.code);
  }

  async finalize(): Promise<void> {
    const nextEntries: Record<string, ModuleTransformCacheIndexEntry> = {};
    for (const modulePath of this.usedPathsThisRun) {
      const entry = this.entriesByPath[modulePath];
      if (entry) {
        nextEntries[modulePath] = entry;
      }
    }

    const index: ModuleTransformCacheIndex = {
      version: MODULE_TRANSFORM_CACHE_VERSION,
      cacheKey: this.cacheKey,
      entries: nextEntries,
    };
    await mkdir(path.dirname(this.indexFilePath), { recursive: true });
    await writeFile(this.indexFilePath, JSON.stringify(index, null, 2), 'utf8');

    await mkdir(this.payloadDirPath, { recursive: true });
    const payloadWrites = Object.entries(nextEntries).map(([modulePath, entry]) => {
      const value = this.loadedPayloads.get(modulePath);
      assert(value);

      return writeFile(
        path.resolve(this.payloadDirPath, entry.payloadFileName),value,        'utf8'
      );
    });
    await Promise.all(payloadWrites);

    let payloadFileNames: string[];
    try {
      payloadFileNames = await readdir(this.payloadDirPath);
    } catch {
      return;
    }

    const activePayloadFileNames = new Set(
      Object.values(nextEntries).map((entry) => entry.payloadFileName),
    );

    const staleDeletes = payloadFileNames
      .filter((fileName) => !activePayloadFileNames.has(fileName))
      .map((fileName) => rm(path.resolve(this.payloadDirPath, fileName), { force: true }));

    await Promise.allSettled(staleDeletes);
  }
}

async function loadIndexEntries(
  indexFilePath: string,
  cacheKey: string,
): Promise<Record<string, ModuleTransformCacheEntry>> {
  try {
    const raw = await readFile(indexFilePath, 'utf8');
    const parsed = JSON.parse(raw);

    // Version match gates trust; no further validation needed
    if (parsed.version !== MODULE_TRANSFORM_CACHE_VERSION || parsed.cacheKey !== cacheKey) {
      return {};
    }

    return parsed.entries as Record<string, ModuleTransformCacheEntry>;
  } catch {
    return {};
  }
}

function buildPayloadFileName(modulePath: string, sourceMtimeMs: number, sourceSize: number): string {
  const payloadHash = modulePath
    .split('')
    .reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
  const fingerprintBits = `${sourceMtimeMs}-${sourceSize}`;
  const compactHash = Math.abs(payloadHash).toString(16).padStart(8, '0');
  return `${compactHash}-${Buffer.from(fingerprintBits, 'utf8').toString('hex')}.json`;
}
