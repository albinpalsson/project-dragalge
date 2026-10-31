import { stat } from 'node:fs/promises';
import type { PerformanceOutputFile } from '../performance-collector.ts';

function inferCompressedKind(filePath: string): 'js' | 'css' | 'html' {
    const lower = filePath.toLowerCase();
    if (lower.includes('.css.')) {
        return 'css';
    }
    if (lower.includes('.html.')) {
        return 'html';
    }
    return 'js';
}

export async function collectOutputFiles(input: {
    outputPath: string;
    chunkOutputPaths: string[];
    cssOutputPaths: string[];
    htmlOutputPath: string | null;
    compressedOutputPaths: string[];
}): Promise<PerformanceOutputFile[]> {
    const files: PerformanceOutputFile[] = [];

    for (const jsPath of [input.outputPath, ...input.chunkOutputPaths]) {
        files.push({
            path: jsPath,
            sizeBytes: (await stat(jsPath)).size,
            kind: 'js',
            stage: 'processed',
        });
    }

    for (const cssPath of input.cssOutputPaths) {
        files.push({
            path: cssPath,
            sizeBytes: (await stat(cssPath)).size,
            kind: 'css',
            stage: 'processed',
        });
    }

    if (input.htmlOutputPath) {
        files.push({
            path: input.htmlOutputPath,
            sizeBytes: (await stat(input.htmlOutputPath)).size,
            kind: 'html',
            stage: 'processed',
        });
    }

    for (const compressedPath of input.compressedOutputPaths) {
        files.push({
            path: compressedPath,
            sizeBytes: (await stat(compressedPath)).size,
            kind: inferCompressedKind(compressedPath),
            stage: 'compressed',
        });
    }

    return files;
}
