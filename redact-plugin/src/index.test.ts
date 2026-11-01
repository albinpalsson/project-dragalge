import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AST_LITE_VERSION, type AstNode } from './ast-types.ts';
import { redactPlugin } from './index.ts';

const APP_PATH = '/app/.cache/tsgo-cjs/index.js';
const REDACT_PATH =
    '/app/node_modules/@tanstack/redact/dist/dom/features/index.js';

function requireOf(specifier: string): AstNode[] {
    return [
        { type: 'blob', code: 'const x = require(' },
        { type: 'protected', kind: 'string', code: `"${specifier}"` },
        { type: 'blob', code: ');' },
    ];
}

function rewrite(
    body: AstNode[],
    path: string,
    plugin = redactPlugin({ include: ['context'] }),
): AstNode[] {
    const program = {
        type: 'program',
        version: AST_LITE_VERSION,
        body,
    } as const;
    return plugin.moduleTransform({ path, program }).body;
}

test('aliases React entry points to Redact', () => {
    const expected = {
        react: '@tanstack/redact',
        'react/jsx-runtime': '@tanstack/redact/jsx-runtime',
        'react/jsx-dev-runtime': '@tanstack/redact/jsx-dev-runtime',
        'react-dom': '@tanstack/redact/dom',
        'react-dom/client': '@tanstack/redact/dom-client',
    };
    for (const [from, to] of Object.entries(expected)) {
        assert.deepEqual(rewrite(requireOf(from), APP_PATH), requireOf(to));
    }
});

test('leaves other specifiers and non-require strings alone', () => {
    const other = requireOf('./react');
    assert.deepEqual(rewrite(other, APP_PATH), other);

    const label: AstNode[] = [
        { type: 'blob', code: 'const x = ' },
        { type: 'protected', kind: 'string', code: '"react"' },
    ];
    assert.deepEqual(rewrite(label, APP_PATH), label);
});

test('keeps the quote style of the specifier', () => {
    const body: AstNode[] = [
        { type: 'blob', code: 'require(' },
        { type: 'protected', kind: 'string', code: "'react'" },
    ];
    assert.deepEqual(rewrite(body, APP_PATH)[1], {
        type: 'protected',
        kind: 'string',
        code: "'@tanstack/redact'",
    });
});

test('rewrites requires inside conditional branches', () => {
    const body: AstNode[] = [
        {
            type: 'conditional',
            branches: [{ statement: 'a', code: requireOf('react') }],
            elseCode: requireOf('react-dom'),
        },
    ];
    assert.deepEqual(rewrite(body, APP_PATH), [
        {
            type: 'conditional',
            branches: [{ statement: 'a', code: requireOf('@tanstack/redact') }],
            elseCode: requireOf('@tanstack/redact/dom'),
        },
    ]);
});

test('stubs features that are not included, only inside Redact', () => {
    assert.deepEqual(
        rewrite(requireOf('./memo/index.js'), REDACT_PATH),
        requireOf('./memo/stub.js'),
    );
    assert.deepEqual(
        rewrite(requireOf('./features/class/index.js'), REDACT_PATH),
        requireOf('./features/class/stub.js'),
    );
    const included = requireOf('./context/index.js');
    assert.deepEqual(rewrite(included, REDACT_PATH), included);
    const appFile = requireOf('./memo/index.js');
    assert.deepEqual(rewrite(appFile, APP_PATH), appFile);
});

test('stubs every feature by default', () => {
    assert.deepEqual(
        rewrite(
            requireOf('./view-transition/index.js'),
            REDACT_PATH,
            redactPlugin(),
        ),
        requireOf('./view-transition/stub.js'),
    );
});

test('suspense keeps its runtime', () => {
    const runtime = requireOf('./suspense-runtime/index.js');
    assert.deepEqual(
        rewrite(runtime, REDACT_PATH, redactPlugin({ include: ['suspense'] })),
        runtime,
    );
    assert.deepEqual(
        rewrite(runtime, REDACT_PATH),
        requireOf('./suspense-runtime/stub.js'),
    );
});

test('the included features are part of the cache version', () => {
    assert.notEqual(
        redactPlugin({ include: ['memo'] }).version,
        redactPlugin({ include: ['lazy'] }).version,
    );
});

test('rejects an unknown AST version', () => {
    const plugin = redactPlugin();
    assert.throws(() =>
        plugin.moduleTransform({
            path: APP_PATH,
            program: { version: 'old' } as never,
        }),
    );
});
