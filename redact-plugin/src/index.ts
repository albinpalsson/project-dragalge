import { posix } from 'node:path';
import {
    AST_LITE_VERSION,
    type AstNode,
    type ProgramNode,
} from './ast-types.ts';

/** Directory names under Redact's `dist/dom/features/`, each with a `stub.js`. */
const FEATURES = [
    'activity',
    'class',
    'context',
    'forward-ref',
    'fragment-refs',
    'hydration',
    'lazy',
    'memo',
    'portal',
    'suspense',
    'view-transition',
] as const;

export type RedactFeature = (typeof FEATURES)[number];

export interface RedactPluginOptions {
    /** Features to keep. Every other feature becomes Redact's smaller stub. */
    include?: RedactFeature[];
}

export interface RedactTransformRequest {
    mode: 'production' | 'dev';
    path: string;
    program: ProgramNode;
}

export interface RedactTransform {
    version: string;
    moduleTransform: (request: RedactTransformRequest) => ProgramNode;
}

const ALIASES: Record<string, string> = {
    react: '@tanstack/redact',
    'react/jsx-runtime': '@tanstack/redact/jsx-runtime',
    'react/jsx-dev-runtime': '@tanstack/redact/jsx-dev-runtime',
    'react-dom': '@tanstack/redact/dom',
    'react-dom/client': '@tanstack/redact/dom-client',
};

const redactPathRegex = /[\\/]node_modules[\\/]@tanstack[\\/]redact[\\/]/;
const requireCallRegex = /(?<![.\w$])require\(\s*$/;

// Redact modules that only run behind `NODE_ENV !== "production"` guards
// (devtools integration and fast refresh), matched by resolved path.
const devOnlyModuleRegex =
    /\/@tanstack\/redact\/dist\/(core\/devtools|dom\/devtools|dom\/devtools-effects|dom\/refresh)\.js$/;
const DEV_ONLY_STUB = '@project-dragalge/redact-plugin/dev-only-stub';

/**
 * Redirects requires from React to Redact, from features to their stubs, and
 * in production from Redact's dev-only modules to an empty stub.
 */
export function redactPlugin(
    options: RedactPluginOptions = {},
): RedactTransform {
    const include = options.include ?? [];
    const stubbed: string[] = FEATURES.filter(
        (feature) => !include.includes(feature),
    );
    // `suspense-runtime` is a separate directory but not a separate choice.
    if (!include.includes('suspense')) {
        stubbed.push('suspense-runtime');
    }
    const stubRegex = new RegExp(`(^|/)(${stubbed.join('|')})/index\\.js$`);

    return {
        version: `redact-plugin:v2:${stubbed.join(',')}`,
        moduleTransform: ({ mode, path, program }) => {
            if (program.version !== AST_LITE_VERSION) {
                throw new Error(
                    `Unsupported AST-lite version: ${String(program.version)}. Expected ${AST_LITE_VERSION}.`,
                );
            }

            const insideRedact = redactPathRegex.test(path);
            const directory = path.replaceAll('\\', '/').replace(/\/[^/]*$/, '');
            const isDevOnly = (specifier: string) =>
                mode === 'production' &&
                specifier.startsWith('.') &&
                devOnlyModuleRegex.test(posix.join(directory, specifier));
            const redirect = (specifier: string) => {
                if (!insideRedact) {
                    return ALIASES[specifier] ?? specifier;
                }
                return isDevOnly(specifier)
                    ? DEV_ONLY_STUB
                    : specifier.replace(stubRegex, '$1$2/stub.js');
            };
            return {
                ...program,
                body: rewriteRequires(program.body, redirect),
            };
        },
    };
}

function rewriteRequires(
    nodes: AstNode[],
    redirect: (specifier: string) => string,
): AstNode[] {
    return nodes.map((node, index) => {
        const previous = nodes[index - 1];
        if (
            node.type === 'protected' &&
            node.kind === 'string' &&
            previous?.type === 'blob' &&
            requireCallRegex.test(previous.code)
        ) {
            const quote = node.code[0];
            const specifier = redirect(node.code.slice(1, -1));
            return { ...node, code: `${quote}${specifier}${quote}` };
        }

        if (node.type === 'conditional') {
            return {
                ...node,
                branches: node.branches.map((branch) => ({
                    ...branch,
                    code: rewriteRequires(branch.code, redirect),
                })),
                elseCode:
                    node.elseCode && rewriteRequires(node.elseCode, redirect),
            };
        }

        return node;
    });
}
