import { stat } from 'node:fs/promises';
import path from 'node:path';
import { version } from 'typescript';
import {
    API,
    type CreateSnapshotProgramParams,
    type Diagnostic,
    DiagnosticCategory,
    formatDiagnosticsWithColorAndContext,
    type Program,
    type Snapshot,
} from 'typescript/async';
import { serverFS } from 'typescript/fs';
import type { SyntheticProjectId } from 'typescript/proto';
import type { BundlerMode, BundlerTarget } from '../main.ts';
import { resolveTscLib, resolveTscTarget } from './target-resolver.ts';

interface CompileInput {
    entryPath: string;
    mode: BundlerMode;
    outDir: string;
    target: BundlerTarget | undefined;
}

interface CompilationResult {
    cacheSalt: string;
    outputFiles: ReadonlyMap<string, { readonly text: string }>;
}

function buildCompilerOverrideArgs(input: CompileInput): string[] {
    const compileArgs = [
        '--rootDir',
        path.dirname(input.entryPath),
        '--outDir',
        input.outDir,
        '--module',
        'commonjs',
        '--moduleResolution',
        'bundler',
        '--target',
        resolveTscTarget(input.target),
        '--lib',
        resolveTscLib(input.target),
        '--noEmit',
        'false',
    ];

    if (input.mode === 'dev') {
        compileArgs.push('--noCheck');
    }

    return compileArgs;
}

async function findConfigFile(cwd: string): Promise<string> {
    let directory = cwd;
    while (true) {
        const candidate = path.join(directory, 'tsconfig.json');
        try {
            if ((await stat(candidate)).isFile()) {
                return candidate;
            }
        } catch (error) {
            if (
                !(error instanceof Error) ||
                !('code' in error) ||
                error.code !== 'ENOENT'
            ) {
                throw error;
            }
        }
        const parent = path.dirname(directory);
        if (parent === directory) {
            throw new Error(`No tsconfig.json found from ${cwd}.`);
        }
        directory = parent;
    }
}

export class CompilerSession {
    private readonly cwd: string;
    private sourceRootDir: string;
    private readonly api: API;
    private snapshot: Snapshot | undefined;
    private program: Program<SyntheticProjectId> | undefined;
    private configurationKey: string | undefined;
    private readonly inputPaths = new Set<string>();
    private readonly inputDirectories = new Set<string>();
    private closed = false;
    private compilation: Promise<CompilationResult> | undefined;
    private closing: Promise<void> | undefined;

    constructor(cwd: string) {
        this.cwd = path.resolve(cwd);
        this.sourceRootDir = this.cwd;
        this.api = new API({
            cwd: this.cwd,
            fs: {
                ...serverFSDefaults,
                readFile: (fileName) => {
                    this.inputPaths.add(path.resolve(fileName));
                    return serverFS.useOS;
                },
                getAccessibleEntries: (directoryName) => {
                    this.inputDirectories.add(path.resolve(directoryName));
                    return serverFS.useOS;
                },
            },
        });
    }

    getWatchedFilePaths(): string[] {
        return [
            ...this.inputPaths,
            ...[...this.inputDirectories].filter((directory) => {
                const relative = path.relative(this.sourceRootDir, directory);
                return !relative.startsWith('..') && !path.isAbsolute(relative);
            }),
        ];
    }

    async compile(input: CompileInput): Promise<CompilationResult> {
        if (this.closed || this.compilation) {
            throw new Error(
                this.closed
                    ? 'Compiler session is closed.'
                    : 'Compiler session is already compiling.',
            );
        }
        this.compilation = this.compileProgram(input);
        try {
            return await this.compilation;
        } finally {
            this.compilation = undefined;
        }
    }

    private async compileProgram(
        input: CompileInput,
    ): Promise<CompilationResult> {
        this.sourceRootDir = path.dirname(input.entryPath);
        this.inputPaths.clear();
        this.inputDirectories.clear();
        const configPath = await findConfigFile(this.cwd);
        this.inputPaths.add(configPath);
        const configuration = await this.createConfiguration(input, configPath);
        const configurationKey = JSON.stringify(configuration);
        const program = await this.updateProgram(configuration, configurationKey);

        const diagnostics = [
            ...(await program.getConfigFileParsingDiagnostics()),
            ...(await program.getProgramDiagnostics()),
            ...(await program.getSyntacticDiagnostics()),
            ...(await program.getGlobalDiagnostics()),
            ...(input.mode === 'production'
                ? await program.getSemanticDiagnostics()
                : []),
        ];
        this.reportDiagnostics(diagnostics);
        const emitted = await program.emitToString();
        this.reportDiagnostics(emitted.diagnostics);
        if (emitted.emitSkipped) {
            throw new Error('TypeScript API skipped JavaScript emit.');
        }
        return {
            cacheSalt: `typescript-api:${version}:${configurationKey}`,
            outputFiles: emitted.outputFiles,
        };
    }

    private async createConfiguration(
        input: CompileInput,
        configPath: string,
    ): Promise<CreateSnapshotProgramParams> {
        const config = await this.api.parseConfigFile(configPath);
        const overrides = await this.api.parseCommandLine(
            buildCompilerOverrideArgs(input),
        );
        this.reportDiagnostics([...config.errors, ...overrides.errors]);
        return {
            rootFiles: config.fileNames,
            compilerOptions: { ...config.options, ...overrides.options },
            options: { projectReferences: config.projectReferences },
        };
    }

    private async updateProgram(
        configuration: CreateSnapshotProgramParams,
        configurationKey: string,
    ): Promise<Program<SyntheticProjectId>> {
        const previous = this.snapshot;
        let next: Snapshot;
        if (previous && this.program) {
            next = await previous.update({
                // Builds can be requested without watcher events. Revalidate all
                // host inputs, including configuration and module resolution.
                fileNotifications: { invalidateAll: true },
                ensurePrograms: [this.program.id],
                ...(configurationKey !== this.configurationKey
                    ? {
                          reconfigurePrograms: [
                              { ...configuration, id: this.program.id },
                          ],
                      }
                    : {}),
            });
        } else {
            next = await this.api.createSnapshot({
                createPrograms: [configuration],
            });
        }

        const program = this.program
            ? next.getProgram(this.program.id)
            : next.operation.createdPrograms?.[0];
        this.snapshot = next;
        this.program = program;
        this.configurationKey = configurationKey;
        if (previous && previous !== next) {
            await previous.dispose();
        }
        if (!program) {
            throw new Error('TypeScript API did not create a program.');
        }
        return program;
    }

    private reportDiagnostics(diagnostics: readonly Diagnostic[]): void {
        if (diagnostics.length === 0) {
            return;
        }
        const formatted = formatDiagnosticsWithColorAndContext(
            diagnostics,
            this.api,
        );
        if (
            diagnostics.some(
                (diagnostic) =>
                    diagnostic.category === DiagnosticCategory.Error,
            )
        ) {
            throw new Error(`TypeScript compilation failed:\n${formatted}`);
        }
        process.stderr.write(formatted);
    }

    close(): Promise<void> {
        this.closing ??= this.closeSession();
        return this.closing;
    }

    private async closeSession(): Promise<void> {
        this.closed = true;
        try {
            await this.compilation;
        } finally {
            await this.api.close();
        }
    }
}

const serverFSDefaults = {
    directoryExists: serverFS.useOS,
    fileExists: serverFS.useOS,
    realpath: serverFS.useOS,
    stat: serverFS.useOS,
    writeFile: serverFS.useOS,
    removeFile: serverFS.useOS,
} satisfies Omit<
    import('typescript/fs').FileSystemCallbacks,
    'getAccessibleEntries' | 'readFile'
>;
