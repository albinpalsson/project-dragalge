import { assert } from "./assert.ts";

export type PerformanceEntryType = 'moduleTransform' | 'transpile';

export interface PerformanceModuleEntry {
  type: 'moduleTransform';
  moduleName: string;
  durationMs: number;
  sizeFrom: number;
  sizeTo: number;
  additionalInfo?: string;
}

export interface PerformanceTranspileEntry {
  type: 'transpile';
  moduleName: string;
  durationMs: number;
  additionalInfo?: string;
}

export type PerformanceEntry = PerformanceModuleEntry | PerformanceTranspileEntry;

export interface PerformanceBundleSummary {
  totalDurationMs: number;
  moduleCount: number;
  assetSizes: Record<'js' | 'css', PerformanceAssetSizeSummary>;
  outputFiles: PerformanceOutputFile[];
}

export interface PerformanceAssetSizeSummary {
  sourceSizeBytes: number;
  processedSizeBytes: number;
  compressedSizeBytes: number;
}

export interface PerformanceOutputFile {
  path: string;
  sizeBytes: number;
  kind: 'js' | 'css' | 'html';
  stage: 'processed' | 'compressed';
}

export interface PerformanceCollectorOutput {
  write(text: string): void;
}

export class BundlerPerformanceCollector {
  private readonly entries: PerformanceEntry[] = [];
  private bundleStartedAt = 0;
  private summary: PerformanceBundleSummary | undefined;
  private wroteProgressDots = false;

  private readonly output: PerformanceCollectorOutput;

  constructor(output?: PerformanceCollectorOutput) {
    this.output = output ?? process.stdout;
  }

  startBundle(): void {
    this.bundleStartedAt = performance.now();
    this.summary = undefined;
    this.entries.length = 0;
    this.wroteProgressDots = false;
  }

  add(
    type: 'moduleTransform',
    moduleName: string,
    durationMs: number,
    sizeFrom: number,
    sizeTo: number,
    additionalInfo?: string,
  ): void;
  add(type: 'transpile', moduleName: string, durationMs: number, additionalInfo?: string): void;
  add(
    type: PerformanceEntryType,
    moduleName: string,
    durationMs: number,
    arg4?: number | string,
    arg5?: number,
    arg6?: string,
  ): void {
    if (type === 'moduleTransform') {
      assert(typeof arg4 === 'number')
      assert(typeof arg5 === 'number');

      this.entries.push({
        type,
        moduleName,
        durationMs,
        sizeFrom: arg4,
        sizeTo: arg5,
        additionalInfo: arg6,
      });
    } else {
      this.entries.push({
        type,
        moduleName,
        durationMs,
        additionalInfo: typeof arg4 === 'string' ? arg4 : undefined,
      });
    }

    this.output.write('.');
    this.wroteProgressDots = true;
  }

  bundleFinished(input: {
    totalDurationMs?: number;
    outputFiles?: PerformanceOutputFile[];
  }): void {
    const totalDurationMs = input.totalDurationMs ?? Math.max(0, performance.now() - this.bundleStartedAt);
    const outputFiles = input.outputFiles ?? [];

    const assetSizes: Record<'js' | 'css', PerformanceAssetSizeSummary> = {
      js: { sourceSizeBytes: 0, processedSizeBytes: 0, compressedSizeBytes: 0 },
      css: { sourceSizeBytes: 0, processedSizeBytes: 0, compressedSizeBytes: 0 },
    };

    for (const entry of this.entries) {
      if (entry.type !== 'moduleTransform') {
        continue;
      }

      const kind: 'js' | 'css' = entry.moduleName.endsWith('.css') ? 'css' : 'js';
      assetSizes[kind].sourceSizeBytes += entry.sizeFrom;
    }

    for (const file of outputFiles) {
      if (file.kind !== 'js' && file.kind !== 'css') {
        continue;
      }
      if (file.stage === 'processed') {
        assetSizes[file.kind].processedSizeBytes += file.sizeBytes;
      } else {
        assetSizes[file.kind].compressedSizeBytes += file.sizeBytes;
      }
    }

    this.summary = {
      totalDurationMs,
      moduleCount: this.entries.length,
      assetSizes,
      outputFiles,
    };
  }

  getEntries(): readonly PerformanceEntry[] {
    return this.entries;
  }

  getSummary(): PerformanceBundleSummary | undefined {
    return this.summary;
  }

  printSummary(): void {
    if (!this.summary) {
      return;
    }

    if (this.wroteProgressDots) {
      this.output.write('\n');
      this.wroteProgressDots = false;
    }
    
    this.output.write(`Modules processed: ${this.summary.moduleCount}\n`);
    this.output.write('Module                Time     Size\n');

    const moduleEntries = this.entries.filter((entry): entry is PerformanceModuleEntry => entry.type === 'moduleTransform');
    for (const entry of moduleEntries) {
      const module = padRight(entry.moduleName, 20);
      const time = padLeft(`${entry.durationMs.toFixed(1)}ms`, 8);
      const size = `${formatKb(entry.sizeFrom)} -> ${formatKb(entry.sizeTo)}`;
      const info = entry.additionalInfo ? ` (${entry.additionalInfo})` : '';
      this.output.write(`${module} ${time}  ${size}${info}\n`);
    }

    this.output.write('Asset sizes: (compressed)\n');
    this.output.write(
      `- js: ${formatKb(this.summary.assetSizes.js.sourceSizeBytes)} (${formatKb(this.summary.assetSizes.js.compressedSizeBytes)})\n`,
    );
    this.output.write(
      `- css: ${formatKb(this.summary.assetSizes.css.sourceSizeBytes)} (${formatKb(this.summary.assetSizes.css.compressedSizeBytes)})\n`,
    );

    const transpileDurationMs = this.entries
      .filter((entry): entry is PerformanceTranspileEntry => entry.type === 'transpile')
      .reduce((total, entry) => total + entry.durationMs, 0);
    if (transpileDurationMs > 0) {
      this.output.write(`TSC transpile time: ${formatMs(transpileDurationMs)}\n`);
    }
    this.output.write(`Total bundle time: ${formatMs(this.summary.totalDurationMs)}\n`);
  }
}

function formatMs(value: number): string {
  return `${value.toFixed(1)}ms`;
}

function formatKb(sizeInBytes: number): string {
  return `${(sizeInBytes / 1024).toFixed(1)}kb`;
}

function padRight(value: string, length: number): string {
  if (value.length >= length) {
    return value;
  }

  return `${value}${' '.repeat(length - value.length)}`;
}

function padLeft(value: string, length: number): string {
  if (value.length >= length) {
    return value;
  }

  return `${' '.repeat(length - value.length)}${value}`;
}
