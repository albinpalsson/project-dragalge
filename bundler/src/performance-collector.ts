import { assert } from './assert.ts';
import { getPackageGroup } from './utils/package-group.ts';

export type PerformanceEntryType = 'moduleTransform' | 'transpile';

export interface PerformanceModuleEntry {
    type: 'moduleTransform';
    filePath: string;
    durationMs: number;
    sizeFrom: number;
    sizeTo: number;
    cacheHit: boolean;
}

export interface PerformanceTranspileEntry {
    type: 'transpile';
    moduleName: string;
    durationMs: number;
    additionalInfo?: string;
}

export type PerformanceEntry =
    | PerformanceModuleEntry
    | PerformanceTranspileEntry;

export interface PerformanceBundleSummary {
    totalDurationMs: number;
    moduleCount: number;
    assetSizes: Record<'js' | 'css', PerformanceAssetSizeSummary>;
    outputFiles: PerformanceOutputFile[];
    packages: PerformancePackageSummary[];
}

export interface PerformancePackageSummary {
    packageName: string;
    moduleCount: number;
    cacheHitCount: number;
    totalDurationMs: number;
    sizeFrom: number;
    sizeTo: number;
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
        filePath: string,
        durationMs: number,
        sizeFrom: number,
        sizeTo: number,
        cacheHit: boolean,
    ): void;
    add(
        type: 'transpile',
        moduleName: string,
        durationMs: number,
        additionalInfo?: string,
    ): void;
    add(
        type: PerformanceEntryType,
        moduleName: string,
        durationMs: number,
        arg4?: number | string,
        arg5?: number,
        arg6?: boolean,
    ): void {
        if (type === 'moduleTransform') {
            assert(typeof arg4 === 'number');
            assert(typeof arg5 === 'number');

            this.entries.push({
                type,
                filePath: moduleName,
                durationMs,
                sizeFrom: arg4,
                sizeTo: arg5,
                cacheHit: arg6 === true,
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
        const totalDurationMs =
            input.totalDurationMs ??
            Math.max(0, performance.now() - this.bundleStartedAt);
        const outputFiles = input.outputFiles ?? [];

        const assetSizes: Record<'js' | 'css', PerformanceAssetSizeSummary> = {
            js: {
                sourceSizeBytes: 0,
                processedSizeBytes: 0,
                compressedSizeBytes: 0,
            },
            css: {
                sourceSizeBytes: 0,
                processedSizeBytes: 0,
                compressedSizeBytes: 0,
            },
        };

        const packages = new Map<string, PerformancePackageSummary>();

        for (const entry of this.entries) {
            if (entry.type !== 'moduleTransform') {
                continue;
            }

            const kind: 'js' | 'css' = entry.filePath.endsWith('.css')
                ? 'css'
                : 'js';
            assetSizes[kind].sourceSizeBytes += entry.sizeFrom;

            const packageName = getPackageGroup(entry.filePath);
            let group = packages.get(packageName);
            if (!group) {
                group = {
                    packageName,
                    moduleCount: 0,
                    cacheHitCount: 0,
                    totalDurationMs: 0,
                    sizeFrom: 0,
                    sizeTo: 0,
                };
                packages.set(packageName, group);
            }
            group.moduleCount += 1;
            group.cacheHitCount += entry.cacheHit ? 1 : 0;
            group.totalDurationMs += entry.durationMs;
            group.sizeFrom += entry.sizeFrom;
            group.sizeTo += entry.sizeTo;
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
            packages: [...packages.values()].sort(
                (a, b) => b.totalDurationMs - a.totalDurationMs,
            ),
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
        this.output.write(
            `${padRight('Package', 32)} ${padLeft('Modules', 7)} ${padLeft('Time', 9)} ${padLeft('Cached', 7)}  Size\n`,
        );

        for (const group of this.summary.packages) {
            const name = padRight(group.packageName, 32);
            const modules = padLeft(String(group.moduleCount), 7);
            const time = padLeft(formatMs(group.totalDurationMs), 9);
            const cached = padLeft(
                formatPercent(group.cacheHitCount / group.moduleCount),
                7,
            );
            const size = `${formatKb(group.sizeFrom)} -> ${formatKb(group.sizeTo)}`;
            this.output.write(`${name} ${modules} ${time} ${cached}  ${size}\n`);
        }

        this.output.write('Asset sizes: (compressed)\n');
        this.output.write(
            `- js: ${formatKb(this.summary.assetSizes.js.sourceSizeBytes)} (${formatKb(this.summary.assetSizes.js.compressedSizeBytes)})\n`,
        );
        this.output.write(
            `- css: ${formatKb(this.summary.assetSizes.css.sourceSizeBytes)} (${formatKb(this.summary.assetSizes.css.compressedSizeBytes)})\n`,
        );

        const transpileDurationMs = this.entries
            .filter(
                (entry): entry is PerformanceTranspileEntry =>
                    entry.type === 'transpile',
            )
            .reduce((total, entry) => total + entry.durationMs, 0);
        if (transpileDurationMs > 0) {
            this.output.write(
                `TypeScript API transpile time: ${formatMs(transpileDurationMs)}\n`,
            );
        }
        this.output.write(
            `Total bundle time: ${formatMs(this.summary.totalDurationMs)}\n`,
        );
    }
}

function formatMs(value: number): string {
    return `${value.toFixed(1)}ms`;
}

function formatKb(sizeInBytes: number): string {
    return `${(sizeInBytes / 1024).toFixed(1)}kb`;
}

function formatPercent(ratio: number): string {
    return `${Math.round(ratio * 100)}%`;
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
