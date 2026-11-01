import type { AstNode, ProgramNode } from '../ast-lite/index.ts';

export const HOIST_VERSION = 'v2';

/** A top-level source line; string contents are masked out of `text`. */
interface Line {
    nodes: AstNode[];
    text: string;
}

/**
 * ESM evaluates imports before the module body, but TypeScript's CommonJS emit
 * leaves each `require` at its import's source position. Moves the import lines
 * above the body and keeps their order. TypeScript writes one statement per line,
 * so working on top-level lines is enough. Programs with nothing to move come
 * back unchanged.
 */
export function hoistRequires(program: ProgramNode): ProgramNode {
    const lines = splitTopLevelLines(program.body);
    const markerIndex = lines.findIndex((line) =>
        line.nodes.some(isEsModuleMarker),
    );
    if (markerIndex < 0) {
        return program;
    }

    // The `exports.f = f` lines stay first so a cycle partner can already see
    // hoisted functions.
    let bodyStart = markerIndex + 1;
    while (bodyStart < lines.length && isExportsLine(lines[bodyStart])) {
        bodyStart += 1;
    }

    const body = lines.slice(bodyStart);
    const firstCode = body.findIndex((line) => isCode(line) && !isImport(line));
    if (firstCode < 0 || !body.slice(firstCode).some(isImport)) {
        return program;
    }

    const reordered = [
        ...lines.slice(0, bodyStart),
        ...body.filter(isImport),
        ...body.filter((line) => !isImport(line)),
    ];
    return { ...program, body: reordered.flatMap((line) => line.nodes) };
}

function splitTopLevelLines(body: AstNode[]): Line[] {
    const lines: Line[] = [];
    let current: Line = { nodes: [], text: '' };
    let depth = 0;

    const finishLine = () => {
        if (current.nodes.length > 0) {
            lines.push(current);
            current = { nodes: [], text: '' };
        }
    };
    const addBlob = (code: string) => {
        if (code) {
            current.nodes.push({ type: 'blob', code });
            current.text += code;
        }
    };

    for (const node of body) {
        if (node.type === 'blob') {
            let lineStart = 0;
            for (let i = 0; i < node.code.length; i++) {
                const ch = node.code[i];
                if ('{(['.includes(ch)) {
                    depth += 1;
                } else if ('})]'.includes(ch)) {
                    depth -= 1;
                } else if (ch === '\n' && depth === 0) {
                    addBlob(node.code.slice(lineStart, i + 1));
                    finishLine();
                    lineStart = i + 1;
                }
            }
            addBlob(node.code.slice(lineStart));
        } else if (node.type === 'protected') {
            current.nodes.push(node);
            current.text += '""';
        } else {
            current.nodes.push(node);
            current.text += node.type === 'conditional' ? 'if' : '';
            if (depth === 0) {
                finishLine();
            }
        }
    }
    finishLine();
    return lines;
}

function isEsModuleMarker(node: AstNode): boolean {
    return node.type === 'protected' && node.code === '"__esModule"';
}

function isCode(line: Line): boolean {
    return line.text.trim().length > 0;
}

function isExportsLine({ text }: Line): boolean {
    return text.startsWith('exports.') && !text.includes('(');
}

/** A brace or arrow means the `require` runs later, not at module load. */
function isImport({ text }: Line): boolean {
    if (text.startsWith('Object.defineProperty(exports, ')) {
        return text.includes('enumerable: true');
    }
    return (
        text.includes('require("")') &&
        !text.includes('{') &&
        !text.includes('=>')
    );
}
