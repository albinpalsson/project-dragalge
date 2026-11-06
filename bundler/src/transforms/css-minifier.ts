import type { PostModuleTransformRequest } from '../main.ts';

// The first group is kept verbatim: comments, quoted strings and `url(...)`.
// Everything else is whitespace around punctuation, which is rewritten:
//   `;` before `}` is dropped, spaces around `{ } ; ,` and after `:` are
//   removed, and any other whitespace run becomes one space. A space before
//   `:` stays because it is significant in selectors (`.a :hover`), and
//   combinators, `calc()` operators and `@media ... and (` are left alone.
const cssTokenRegex =
    /(\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|url\([^)]*\))|\s*;\s*\}\s*|\s*([{};,])\s*|:\s+|\s+/g;

export function minifyCss(css: string): string {
    return css
        .replace(
            cssTokenRegex,
            (match, kept: string | undefined, punctuation: string | undefined) => {
                if (kept !== undefined) {
                    return kept;
                }
                if (punctuation !== undefined) {
                    return punctuation;
                }
                if (match.startsWith(':')) {
                    return ':';
                }
                if (/^\s*;/.test(match)) {
                    return '}';
                }
                return ' ';
            },
        )
        .trim();
}

export function createCssMinifierTransform() {
    return {
        version: 'css-minifier:v1',
        postModuleTransform: (request: PostModuleTransformRequest): void => {
            for (const dependency of request.dependencies) {
                if (dependency.type === 'css') {
                    dependency.code = minifyCss(dependency.code);
                }
            }
        },
    };
}
