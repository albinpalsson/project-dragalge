import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { startDevServer } from './dev-server/index.ts';

async function withTmpDir(fn: (dir: string) => Promise<void>): Promise<void> {
    const dir = await mkdtemp(
        path.join(os.tmpdir(), 'bundler-dev-server-test-'),
    );
    try {
        await fn(dir);
    } finally {
        await rm(dir, { recursive: true, force: true });
    }
}

async function waitFor<T>(
    fn: () => Promise<T>,
    predicate: (value: T) => boolean,
    input?: { timeoutMs?: number; intervalMs?: number },
): Promise<T> {
    const timeoutMs = input?.timeoutMs ?? 10000;
    const intervalMs = input?.intervalMs ?? 100;
    const start = Date.now();

    // Poll until condition matches or timeout to absorb async rebuild latency.
    while (true) {
        try {
            const value = await fn();
            if (predicate(value)) {
                return value;
            }
        } catch {
            // Rebuild windows may briefly produce unavailable responses; keep polling.
        }

        if (Date.now() - start >= timeoutMs) {
            throw new Error(
                `Timed out after ${timeoutMs}ms waiting for expected state.`,
            );
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
}

function extractHtmlAssetSignature(html: string): string {
    const script =
        html.match(/<script src="([^"]+\.js)"><\/script>/i)?.[1] ?? '';
    const css =
        html.match(/<link rel="stylesheet" href="([^"]+\.css)">/i)?.[1] ?? '';
    if (!script) {
        throw new Error('Could not find bundled script tag in HTML response.');
    }

    return `${script}|${css}`;
}

test('dev server serves html and updates output after source file change', async () => {
    await withTmpDir(async (tmpDir) => {
        const srcDir = path.join(tmpDir, 'src');
        await mkdir(srcDir, { recursive: true });

        await writeFile(
            path.join(srcDir, 'index.ts'),
            ["import './index.css';", "console.log('version-one');"].join('\n'),
            'utf8',
        );
        await writeFile(
            path.join(srcDir, 'index.css'),
            'body { color: red; }\n',
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
                '<div id="app"></div>',
                '<!-- bundler:js -->',
                '</body>',
                '</html>',
            ].join('\n'),
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

        const server = await startDevServer({
            cwd: tmpDir,
            host: '127.0.0.1',
            port: 0,
            configOverrides: {
                entry: 'src/index.ts',
                outputDir: 'dist',
            },
        });

        try {
            const baseUrl = server.getBaseUrl();

            const firstResponse = await fetch(`${baseUrl}/`);
            assert.equal(firstResponse.status, 200);
            const firstHtml = await firstResponse.text();
            const firstAssetSignature = extractHtmlAssetSignature(firstHtml);

            await writeFile(
                path.join(srcDir, 'index.css'),
                'body { color: blue; }\n',
                'utf8',
            );

            const updatedHtml = await waitFor(
                async () => {
                    const response = await fetch(`${baseUrl}/`);
                    if (response.status !== 200) {
                        throw new Error(
                            `Unexpected status during rebuild: ${response.status}`,
                        );
                    }
                    return response.text();
                },
                (html) =>
                    extractHtmlAssetSignature(html) !== firstAssetSignature,
            );

            const secondAssetSignature = extractHtmlAssetSignature(updatedHtml);
            assert.notEqual(secondAssetSignature, firstAssetSignature);
        } finally {
            await server.stop();
        }
    });
});
