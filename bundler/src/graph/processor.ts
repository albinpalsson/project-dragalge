import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { parseProgram, writeProgram } from '../ast-lite/index.ts';
import type {
    BundlerMode,
    ModuleTransformMetadata,
    Transform,
} from '../main.ts';
import type { BundlerPerformanceCollector } from '../performance-collector.ts';
import type { ProcessedFileResult } from '../processed-file-result.ts';
import type { EsmTranspiler } from '../transpile/esm.ts';
import type { TranspilationResult } from '../transpile/index.ts';
import {
    extractAdditionalImports,
    inlineAssetModuleCode,
    isCssFilePath,
    isInlineAssetPath,
} from '../utils/index.ts';
import { hoistRequires } from './hoist-requires.ts';
import { findDependencies } from './parser.ts';

export async function processFile(
    filePath: string,
    transpilation: TranspilationResult,
    transforms: Transform[],
    perfCollect: BundlerPerformanceCollector | undefined,
    esmTranspiler: EsmTranspiler,
    mode: BundlerMode,
    inlineAssets: readonly string[],
): Promise<ProcessedFileResult> {
    if (isInlineAssetPath(filePath, inlineAssets)) {
        const data = await readFile(filePath);
        const assetCode = inlineAssetModuleCode(filePath, data);
        perfCollect?.add(
            'moduleTransform',
            filePath,
            0,
            data.length,
            assetCode.length,
            false,
        );
        return {
            type: 'js',
            code: assetCode,
            dependencies: [],
            dynamicDependencies: [],
            prefetchDependencies: [],
            metadata: {},
        };
    }
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
    const cjs = await resolveCjsFile(filePath, transpilation, esmTranspiler);

    const { ast, metadata, processingDurationMs } = await applyModuleTransforms(
        cjs.path,
        cjs.code,
        transforms,
        cjs.typescriptEmitted,
        mode,
    );
    const processingStartTime = performance.now();
    const found = findDependencies(ast.body);
    const dependencies = found
        .filter((dep) => dep.type === 'require')
        .map((dep) => dep.specifier);
    const dynamicDependencies = [
        ...new Set(
            found
                .filter((dep) => dep.type === 'dynamic')
                .map((dep) => dep.specifier),
        ),
    ];
    const prefetchDependencies = [
        ...new Set(
            found
                .filter((dep) => dep.type === 'dynamic' && dep.prefetch)
                .map((dep) => dep.specifier),
        ),
    ];
    const processedCode = writeProgram(ast);

    if (filePath.startsWith(transpilation.sourceRootDir)) {
        for (const sourceDep of extractAdditionalImports(code)) {
            dependencies.push(sourceDep);
        }
    }
    const mixed = dynamicDependencies.find((specifier) =>
        dependencies.includes(specifier),
    );
    if (mixed !== undefined) {
        throw new Error(
            `${filePath}: "${mixed}" is imported both statically and with import(); use one form per module.`,
        );
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
        dynamicDependencies,
        prefetchDependencies,
        metadata,
    };
}

async function resolveCjsFile(
    filePath: string,
    transpilation: TranspilationResult,
    esmTranspiler: EsmTranspiler,
): Promise<{ path: string; code: string; typescriptEmitted: boolean }> {
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
        return { path: transpiledPath, code, typescriptEmitted: true };
    }

    const code = await readFile(filePath, 'utf8');
    const transpiled = await esmTranspiler.transpileIfEsm(filePath, code);
    return transpiled === undefined
        ? { path: filePath, code, typescriptEmitted: false }
        : { path: filePath, code: transpiled, typescriptEmitted: true };
}

export async function applyModuleTransforms(
    modulePath: string,
    code: string,
    transforms: Transform[],
    typescriptEmitted: boolean,
    mode: BundlerMode,
) {
    const parseStartTime = performance.now();
    let ast = parseProgram(code);
    if (typescriptEmitted) {
        ast = hoistRequires(ast);
    }
    let processingDurationMs = performance.now() - parseStartTime;
    const metadata: ModuleTransformMetadata = {};

    for (const transform of transforms) {
        if (transform.moduleTransform) {
            const startTime = performance.now();
            const result = transform.moduleTransform({
                phase: 'module',
                mode,
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
