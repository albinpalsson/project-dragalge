import type { AstNode } from '../ast-lite/index.ts';
import type { ParsedDependency } from './types.ts';

const requireRegex = /require\(\s*$/;
// The CommonJS shape TypeScript emits for `import('x')`, with or without the
// `__importStar` interop helper. Anything else is a plain `require`.
export const dynamicImportRegex =
    /Promise\.resolve\(\)\.then\(\s*(?:\(\)\s*=>|function\s*\(\)\s*\{\s*return)\s*(?:__importStar\(\s*)?require\(\s*$/;

// Written as `import(/* bundler:prefetch */ './x')`. TypeScript keeps the comment
// between `require(` and the specifier, and the minifier preserves it.
const prefetchPragmaRegex = /^\/\*\s*bundler:prefetch\s*\*\/$/;

export function findDependencies(code: AstNode[]): ParsedDependency[] {
    const found: ParsedDependency[] = [];
    for (let i = 0; i < code.length; i++) {
        const node = code[i];
        if (node.type === 'blob' && requireRegex.test(node.code)) {
            const argument = readSpecifierArgument(code, i + 1);
            if (argument) {
                found.push({
                    type: dynamicImportRegex.test(node.code)
                        ? 'dynamic'
                        : 'require',
                    ...argument,
                });
            }
        }
        if (node.type === 'conditional') {
            for (const branch of node.branches) {
                found.push(...findDependencies(branch.code));
            }
            found.push(...findDependencies(node.elseCode ?? []));
        }
    }
    return found;
}

// Reads the string literal after `require(`, skipping comments and the empty
// blobs the minifier leaves where it removed one.
function readSpecifierArgument(
    code: AstNode[],
    start: number,
): { specifier: string; prefetch: boolean } | undefined {
    let prefetch = false;
    let index = start;
    while (isSpecifierTrivia(code[index])) {
        const trivia = code[index];
        if (trivia.type === 'comment' && prefetchPragmaRegex.test(trivia.text)) {
            prefetch = true;
        }
        index++;
    }
    const node = code[index];
    if (node?.type !== 'protected' || node.kind !== 'string') {
        return undefined;
    }
    return { specifier: unquoteDependencySpecifier(node.code), prefetch };
}

function isSpecifierTrivia(node: AstNode | undefined): boolean {
    return (
        node?.type === 'comment' ||
        (node?.type === 'blob' && node.code.trim() === '')
    );
}

export function unquoteDependencySpecifier(value: string): string {
    if (value.length < 2) {
        return value;
    }

    const first = value[0];
    const last = value[value.length - 1];
    if ((first === "'" && last === "'") || (first === '"' && last === '"')) {
        return value.slice(1, -1);
    }

    console.warn(`Dependency specifier is not quoted: ${value}`);
    return value;
}
