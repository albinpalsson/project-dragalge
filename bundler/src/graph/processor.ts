import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseProgram, writeProgram } from '../ast-lite/index.ts';
import type { ModuleTransformMetadata, Transform } from '../main.ts';
import type { BundlerPerformanceCollector } from '../performance-collector.ts';
import type { ProcessedFileResult } from '../processed-file-result.ts';
import type { TranspilationResult } from '../transpile/index.ts';
import { extractAdditionalImports, isCssFilePath } from '../utils/index.ts';
import { findDependencies } from './parser.ts';

export async function processFile(
    filePath: string,
    transpilation: TranspilationResult,
    transforms: Transform[],
    perfCollect: BundlerPerformanceCollector | undefined,
): Promise<ProcessedFileResult> {
    const code = await readFile(filePath, 'utf8');
    if (isCssFilePath(filePath)) {
        perfCollect?.add(
            'moduleTransform',
            filePath,
            0,
            code.length,
            code.length,
            false,
        );
        return { type: 'css', code, dependencies: [] };
    }
    const cjs = await resolveCjsFile(filePath, transpilation);

    const { ast, metadata, processingDurationMs } = await applyModuleTransforms(
        cjs.path,
        cjs.code,
        transforms,
    );
    const processingStartTime = performance.now();
    const dependencies = findDependencies(ast.body).map((dep) => dep.specifier);
    const processedCode = writeProgram(ast);

    if (filePath.startsWith(transpilation.sourceRootDir)) {
        for (const sourceDep of extractAdditionalImports(code)) {
            dependencies.push(sourceDep);
        }
    }
    const totalProcessingDurationMs =
        processingDurationMs + performance.now() - processingStartTime;

    perfCollect?.add(
        'moduleTransform',
        filePath,
        totalProcessingDurationMs,
        code.length,
        processedCode.length,
        false,
    );

    return {
        type: 'js',
        code: processedCode,
        dependencies: Array.from(dependencies),
        metadata,
    };
}

async function resolveCjsFile(
    filePath: string,
    transpilation: TranspilationResult,
): Promise<{ path: string; code: string }> {
    const relativeToSourceRoot = path.relative(
        transpilation.sourceRootDir,
        filePath,
    );
    const isApplicationFile =
        !relativeToSourceRoot.startsWith('..') &&
        !path.isAbsolute(relativeToSourceRoot);

    if (isApplicationFile) {
        const transpiledPath = path
            .resolve(transpilation.outDir, relativeToSourceRoot)
            .replace(/\.(ts|tsx|mts|cts)$/i, '.js');
        const code = await transpilation.readEmittedFile(transpiledPath);
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
    const parseStartTime = performance.now();
    let ast = parseProgram(code);
    let processingDurationMs = performance.now() - parseStartTime;
    const metadata: ModuleTransformMetadata = {};

    for (const transform of transforms) {
        if (transform.moduleTransform) {
            const startTime = performance.now();
            const result = transform.moduleTransform({
                phase: 'module',
                path: modulePath,
                program: ast,
                metadata,
            });
            processingDurationMs += performance.now() - startTime;
            ast = await result;
        }
    }

    return { ast, metadata, processingDurationMs };
}
