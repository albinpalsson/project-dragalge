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

    const t0 = performance.now();
    const { ast, metadata } = await applyModuleTransforms(
        cjs.path,
        cjs.code,
        transforms,
    );
    const dependencies = findDependencies(ast.body).map((dep) => dep.specifier);
    const processedCode = writeProgram(ast);

    if (filePath.startsWith(transpilation.sourceRootDir)) {
        for (const sourceDep of extractAdditionalImports(
            await readFile(filePath, 'utf8'),
        )) {
            dependencies.push(sourceDep);
        }
    }

    const elapsedMs = performance.now() - t0;
    perfCollect?.add(
        'moduleTransform',
        filePath,
        elapsedMs,
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
