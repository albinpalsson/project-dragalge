import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
    type InferOutput,
    object,
    optional,
    parse,
    record,
    string,
    union,
} from '@project-dragalge/validator';
import { assert } from './assert.ts';

interface ParsedBareSpecifier {
    packageName: string;
    packageSubpath: string;
}

const exportsTargetSchema = union([string(), record(string())] as const);

const packageJsonSchema = object({
    exports: optional(union([string(), record(exportsTargetSchema)] as const)),
    main: optional(string()),
});

export class NodeModulesResolver {
    private readonly resolutionCache = new Map<string, Promise<string>>();

    async resolve(specifier: string, fromFilePath: string): Promise<string> {
        const cachedResolution = this.resolutionCache.get(specifier);
        if (cachedResolution) {
            return cachedResolution;
        }

        const resolutionPromise = this.resolveUncached(specifier, fromFilePath);
        this.resolutionCache.set(specifier, resolutionPromise);
        return resolutionPromise;
    }

    private async resolveUncached(
        specifier: string,
        fromFilePath: string,
    ): Promise<string> {
        const parsed = parseBareSpecifier(specifier);
        const packageRoot = await findPackageRoot(
            parsed.packageName,
            fromFilePath,
        );
        const packageJson = await loadPackageJson(packageRoot);

        const target = resolvePackageTarget(specifier, parsed, packageJson);
        const resolvedTarget = toSafePackagePath(
            target,
            packageRoot,
            parsed.packageName,
            specifier,
        );
        const resolvedFilePath =
            await resolveFilePathCandidates(resolvedTarget);

        assert(resolvedFilePath);
        return resolvedFilePath;
    }
}

function parseBareSpecifier(specifier: string): ParsedBareSpecifier {
    const trimmed = specifier.trim();
    if (!trimmed || trimmed.startsWith('.') || path.isAbsolute(trimmed)) {
        throw new Error(`Specifier is not a bare package import: ${specifier}`);
    }

    if (trimmed.startsWith('@')) {
        const segments = trimmed.split('/');
        if (segments.length < 2 || !segments[0] || !segments[1]) {
            throw new Error(`Invalid scoped package specifier: ${specifier}`);
        }

        const packageName = `${segments[0]}/${segments[1]}`;
        const packageSubpath =
            segments.length > 2 ? segments.slice(2).join('/') : '';
        assertValidPackageSubpath(packageSubpath, specifier);
        return { packageName, packageSubpath };
    }

    const segments = trimmed.split('/');
    const packageName = segments[0];
    const packageSubpath =
        segments.length > 1 ? segments.slice(1).join('/') : '';
    assertValidPackageSubpath(packageSubpath, specifier);
    return { packageName, packageSubpath };
}

function assertValidPackageSubpath(subpath: string, specifier: string): void {
    if (!subpath) {
        return;
    }

    if (subpath.includes('..') || subpath.startsWith('/')) {
        throw new Error(
            `Invalid package subpath "${subpath}" in specifier "${specifier}"`,
        );
    }
}

async function findPackageRoot(
    packageName: string,
    fromFilePath: string,
): Promise<string> {
    let currentDir = path.dirname(fromFilePath);

    while (true) {
        const packageRoot = path.resolve(
            currentDir,
            'node_modules',
            packageName,
        );
        const packageJsonPath = path.resolve(packageRoot, 'package.json');
        if (await pathExists(packageJsonPath)) {
            return packageRoot;
        }

        const parent = path.dirname(currentDir);
        if (parent === currentDir) {
            break;
        }
        currentDir = parent;
    }

    throw new Error(
        `Cannot find package "${packageName}" while resolving from ${fromFilePath}`,
    );
}

async function loadPackageJson(packageRoot: string) {
    const packageJsonPath = path.resolve(packageRoot, 'package.json');
    const raw = await readFile(packageJsonPath, 'utf-8');
    return parse(packageJsonSchema, JSON.parse(raw));
}

function resolvePackageTarget(
    specifier: string,
    parsedSpecifier: ParsedBareSpecifier,
    packageJson: InferOutput<typeof packageJsonSchema>,
): string {
    const exportsField = packageJson.exports;
    if (exportsField !== undefined) {
        return resolveFromExports(
            specifier,
            parsedSpecifier.packageSubpath,
            exportsField,
        );
    }

    if (parsedSpecifier.packageSubpath) {
        return `./${parsedSpecifier.packageSubpath}`;
    }

    if (packageJson.main?.trim()) {
        return normalizePackageTarget(packageJson.main);
    }

    return './index.js';
}

type ExportsField = InferOutput<typeof packageJsonSchema>['exports'];
type ExportsTarget = InferOutput<typeof exportsTargetSchema>;

function resolveFromExports(
    specifier: string,
    packageSubpath: string,
    exportsField: NonNullable<ExportsField>,
): string {
    if (typeof exportsField === 'string') {
        if (packageSubpath) {
            throw new Error(
                `Package subpath "${packageSubpath}" is not exported by "${specifier}"`,
            );
        }

        return normalizePackageTarget(exportsField);
    }

    const exportKey = packageSubpath ? `./${packageSubpath}` : '.';
    const target = exportsField[exportKey];

    if (target === undefined) {
        throw new Error(
            `Package subpath "${exportKey}" is not exported by "${specifier}"`,
        );
    }

    return resolveExportsTarget(specifier, exportKey, target);
}

function resolveExportsTarget(
    specifier: string,
    exportKey: string,
    target: ExportsTarget,
): string {
    if (typeof target === 'string') {
        return normalizePackageTarget(target);
    }

    const runtimeKeyOrder = ['require', 'default'] as const;

    for (const runtimeKey of runtimeKeyOrder) {
        const runtimeTarget = target[runtimeKey];
        if (runtimeTarget === undefined) {
            continue;
        }

        return normalizePackageTarget(runtimeTarget);
    }

    throw new Error(
        `Exports target for "${specifier}" at key "${exportKey}" has no runtime condition. Expected one of require or default.`,
    );
}

function normalizePackageTarget(target: string): string {
    if (target.startsWith('./')) {
        return target;
    }

    return `./${target}`;
}

function toSafePackagePath(
    target: string,
    packageRoot: string,
    packageName: string,
    specifier: string,
): string {
    if (!target.startsWith('./')) {
        throw new Error(
            `Invalid package target "${target}" for "${specifier}" in "${packageName}"`,
        );
    }

    const resolved = path.resolve(packageRoot, target);
    const relative = path.relative(packageRoot, resolved);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(
            `Package target "${target}" for "${specifier}" in "${packageName}" escapes package root`,
        );
    }

    return resolved;
}

async function resolveFilePathCandidates(
    targetPath: string,
): Promise<string | undefined> {
    const candidates = [
        targetPath,
        `${targetPath}.js`,
        `${targetPath}.cjs`,
        path.resolve(targetPath, 'index.js'),
        path.resolve(targetPath, 'index.cjs'),
    ];

    for (const candidate of candidates) {
        if (await pathExists(candidate)) {
            return candidate;
        }
    }

    return undefined;
}

export async function pathExists(filePath: string): Promise<boolean> {
    try {
        await stat(filePath);
        return true;
    } catch {
        return false;
    }
}
