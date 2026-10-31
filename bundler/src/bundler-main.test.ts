import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { setTimeout as sleep } from 'node:timers/promises';
import vm from 'node:vm';
import { runBundler } from './main.ts';
import { BundlerPerformanceCollector } from './performance-collector.ts';

async function withTmpDir(fn: (dir: string) => Promise<void>): Promise<void> {
    const dir = await mkdtemp(path.join(os.tmpdir(), 'bundler-test-'));
    try {
        await fn(dir);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}

test('bundles a two-file TS app with a CSS import and produces correct js, css, and html output', async () => {
    await withTmpDir(async (tmpDir) => {
        const srcDir = path.join(tmpDir, 'src');
        await mkdir(srcDir, { recursive: true });

        await writeFile(
            path.join(srcDir, 'math.ts'),
            [
                'export function multiply(a: number, b: number): number {',
                '  return a * b;',
                '}',
            ].join('\n'),
            'utf8',
        );

        await writeFile(
            path.join(srcDir, 'index.ts'),
            [
                "import { multiply } from './math';",
                "import './styles.css';",
                'const values: number[] = [];',
                'if (true) for (let i = 0; i < 3; i++) values.push(i);',
                "let label = 'bad';",
                'switch (values.length) {',
                "  case 3: label = 'ok'; break;",
                "  default: label = 'bad';",
                '}',
                "if (label === 'ok') console.log(multiply(3, 7));",
                "if (label !== 'ok') console.log('unexpected');",
                'console.log(values.join(","), label);',
                'function buildQuery(whereClause: string): string {',
                // biome-ignore lint/suspicious/noTemplateCurlyInString: this is bundled TS source, not an interpolation
                "  return `select * from t${whereClause ? ` where ${whereClause}` : ''}`;",
                '}',
                "console.log(buildQuery('id = 1'));",
                "console.log(buildQuery(''));",
                "import('./lazy').then((lazy) => console.log(lazy.lazyValue()));",
            ].join('\n'),
            'utf8',
        );

        await writeFile(
            path.join(srcDir, 'lazy.ts'),
            [
                'export function lazyValue(): string {',
                "  return 'lazy-ok';",
                '}',
            ].join('\n'),
            'utf8',
        );

        await writeFile(
            path.join(srcDir, 'styles.css'),
            'body { color: red; }\n',
            'utf8',
        );

        await writeFile(
            path.join(srcDir, 'global.d.ts'),
            "declare module '*.css';\n",
            'utf8',
        );

        await writeFile(
            path.join(tmpDir, 'tsconfig.json'),
            [
                '{',
                '  "compilerOptions": {',
                '    "target": "ES2022",',
                '    "moduleResolution": "Bundler",',
                '    "strict": true,',
                '    "skipLibCheck": true,',
                '    "noUncheckedSideEffectImports": false',
                '  },',
                '  "include": ["src"]',
                '}',
            ].join('\n'),
            'utf8',
        );

        await writeFile(
            path.join(srcDir, 'index.html'),
            [
                '<!DOCTYPE html>',
                '<html>',
                '<head>',
                '<!-- bundler:css -->',
                '</head>',
                '<body>',
                '<!-- bundler:js -->',
                '</body>',
                '</html>',
            ].join('\n'),
            'utf8',
        );

        const result = await runBundler({
            cwd: tmpDir,
            performance: new BundlerPerformanceCollector({ write() {} }),
            configOverrides: {
                entry: 'src/index.ts',
                outputDir: 'dist',
                mode: 'production',
                // The lazy module is tiny; keep it out of the main bundle.
                minChunkBytes: 0,
            },
        });

        // --- CSS ---
        assert.equal(result.cssOutputPaths.length, 1);
        const cssContent = await readFile(result.cssOutputPaths[0], 'utf8');
        assert.equal(cssContent, 'body { color: red; }\n');

        // --- HTML ---
        const htmlPath = path.join(
            path.dirname(result.outputPath),
            'index.html',
        );
        const htmlContent = await readFile(htmlPath, 'utf8');
        const jsBasename = path.basename(result.outputPath);
        const cssBasename = path.basename(result.cssOutputPaths[0]);
        assert.match(
            htmlContent,
            new RegExp(`<link rel="stylesheet" href="${cssBasename}">`),
        );
        assert.match(
            htmlContent,
            new RegExp(`<script src="${jsBasename}"></script>`),
        );

        // --- Lazy chunk: separate file, compressed, not in the main bundle ---
        assert.equal(result.chunkOutputPaths.length, 1);
        const chunkPath = result.chunkOutputPaths[0];
        assert.ok(result.compressedOutputPaths.includes(`${chunkPath}.br`));

        const jsContent = await readFile(result.outputPath, 'utf8');

        // --- JS: execute in a mocked browser, which loads chunk scripts ---
        const browser = new MockBrowser(path.join(tmpDir, 'dist'));
        browser.run(jsContent);
        const { logs } = browser;
        assert.equal(logs[0], 21);
        assert.equal(logs[1], '0,1,2');
        assert.equal(logs[2], 'ok');
        assert.equal(logs[3], 'select * from t where id = 1');
        assert.equal(logs[4], 'select * from t');

        await waitFor(() => assert.equal(logs[5], 'lazy-ok'));
    });
});

/**
 * A vm context standing in for a page: it records console output and answers
 * the chunk loader's `<script>` injections by running the file from `distDir`.
 */
class MockBrowser {
    readonly logs: unknown[] = [];
    readonly requestedScripts: string[] = [];
    private readonly context: vm.Context;
    constructor(distDir: string) {
        this.context = vm.createContext({
            console: {
                log: (...args: unknown[]) => {
                    this.logs.push(...args);
                },
            },
            document: {
                createElement: () => ({}),
                head: {
                    appendChild: (script: {
                        src: string;
                        onload: () => void;
                    }) => {
                        this.requestedScripts.push(script.src);
                        readFile(path.join(distDir, script.src), 'utf8')
                            .then((code) => this.run(code))
                            .then(() => script.onload());
                    },
                },
            },
        });
    }

    run(code: string): void {
        vm.runInContext(code, this.context);
    }

}

/** Retries `assertion` until it stops throwing; rethrows its last error on timeout. */
async function waitFor(
    assertion: () => void,
    timeoutMs = 5000,
): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    while (true) {
        try {
            assertion();
            return;
        } catch (error) {
            if (Date.now() >= deadline) {
                throw error;
            }
            await sleep(10);
        }
    }
}
