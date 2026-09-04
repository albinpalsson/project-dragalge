import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
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

        // --- JS: execute in vm, capture console.log ---
        const jsContent = await readFile(result.outputPath, 'utf8');
        const logs: unknown[] = [];
        const context = vm.createContext({
            console: { log: (...args: unknown[]) => logs.push(...args) },
        });
        vm.runInContext(jsContent, context);
        assert.equal(logs[0], 21);
        assert.equal(logs[1], '0,1,2');
        assert.equal(logs[2], 'ok');
        assert.equal(logs[3], 'select * from t where id = 1');
        assert.equal(logs[4], 'select * from t');
    });
});
