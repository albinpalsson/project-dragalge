import {
    AST_LITE_VERSION,
    type AstNode,
    type CommentNode,
    type ConditionalBranch,
    type ConditionalNode,
    type ProgramNode,
} from './types.ts';

export const AST_LITE_PARSER_VERSION = 'v4';

type Node = AstNode;

interface ConditionalScanData {
    branches: Array<{ statement: string; bodyStart: number; bodyEnd: number }>;
    elseStart: number | null;
    elseEnd: number | null;
    end: number;
}

type ScanResult =
    | { kind: 'newline'; code: string }
    | { kind: 'comment'; code: string; commentKind: CommentNode['kind'] }
    | {
          kind: 'conditionScope';
          code: string;
          conditionalData: ConditionalScanData;
      }
    | { kind: 'other'; code: string }
    | { kind: 'string'; code: string }
    | { kind: 'template'; code: string }
    | { kind: 'regex'; code: string };

interface StatementResult {
    bodyCode: string;
    bodyStart: number;
    bodyEnd: number;
    nextStart: number;
}

export function parseProgram(code: string): ProgramNode {
    return {
        type: 'program',
        version: AST_LITE_VERSION,
        body: parse(code),
    };
}

function parse(code: string): Node[] {
    const nodes: Node[] = [];
    const scanner = new Scanner(code);

    while (true) {
        const section = scanner.getNext();
        if (!section) {
            break;
        }

        const node = buildNode(section);
        if (!node) {
            nodes.push({ type: 'blob', code: section.code });
            continue;
        }

        nodes.push(node);
    }

    return mergeBlanklineNodes(nodes);
}

function buildNode(section: ScanResult): Node | undefined {
    switch (section.kind) {
        case 'newline': {
            return {
                type: 'blankline',
                count: countNewlines(section.code),
            };
        }
        case 'comment': {
            return {
                type: 'comment',
                kind: section.commentKind,
                text: section.code,
            };
        }
        case 'conditionScope':
            return buildConditionalNode(section.code, section.conditionalData);
        case 'other': {
            return {
                type: 'blob',
                code: section.code,
            };
        }
        case 'string':
        case 'template':
        case 'regex': {
            return {
                type: 'protected',
                kind: section.kind,
                code: section.code,
            };
        }
        default:
            return undefined;
    }
}

class Scanner {
    private readonly code: string;
    private cursor = 0;
    private queue: ScanResult[] = [];

    constructor(code: string) {
        this.code = code;
    }

    getNext(): ScanResult | undefined {
        if (this.queue.length > 0) {
            const result = this.queue.shift();
            if (!result) {
                return undefined;
            }
            this.cursor += result.code.length;
            return result;
        }

        const remaining = this.code.slice(this.cursor);
        if (!remaining) {
            return undefined;
        }

        const codeState = new CodeStateMachine(remaining);
        const segments = codeState.scanUntilSection((i) =>
            scanSectionAt(remaining, i),
        );

        if (segments.length === 0) {
            return undefined;
        }

        const [first, ...rest] = segments;
        this.queue.push(...rest);
        this.cursor += first.code.length;
        return first;
    }
}

function scanSectionAt(code: string, cursor: number): ScanResult | undefined {
    const blanklineSize = scanBlanklineRun(code.slice(cursor));
    if (blanklineSize > 0) {
        return {
            kind: 'newline',
            code: code.slice(cursor, cursor + blanklineSize),
        };
    }

    if (code.startsWith('//', cursor)) {
        const end = findLineCommentEnd(code, cursor + 2);
        const lineBreakLen = lineBreakLengthAt(code, end);
        return {
            kind: 'comment',
            code: code.slice(cursor, end + lineBreakLen),
            commentKind: 'line',
        };
    }

    if (code.startsWith('/*', cursor)) {
        const close = code.indexOf('*/', cursor + 2);
        const end = close === -1 ? code.length : close + 2;
        return {
            kind: 'comment',
            code: code.slice(cursor, end),
            commentKind: 'block',
        };
    }

    if (startsWithKeyword(code, cursor, 'if')) {
        const conditionalData = scanConditionalBlock(code, cursor);
        if (conditionalData) {
            return {
                kind: 'conditionScope',
                code: code.slice(cursor, conditionalData.end),
                conditionalData: shiftConditionalData(conditionalData, -cursor),
            };
        }
    }

    return undefined;
}

function scanConditionalBlock(
    code: string,
    start: number,
): ConditionalScanData | undefined {
    const branches: ConditionalScanData['branches'] = [];
    let cursor = start;

    while (cursor < code.length) {
        const ifStart = cursor;
        if (!startsWithKeyword(code, ifStart, 'if')) {
            return undefined;
        }

        cursor = skipWhitespace(code, ifStart + 2);
        if (cursor >= code.length || code[cursor] !== '(') {
            return undefined;
        }

        const conditionEnd = findMatching(code, cursor, '(', ')');
        if (conditionEnd === undefined) {
            return undefined;
        }

        const statement = code.slice(cursor + 1, conditionEnd).trim();
        const branchStart = skipWhitespace(code, conditionEnd + 1);
        if (branchStart >= code.length || code[branchStart] !== '{') {
            return undefined;
        }
        const stmtResult = parseStatement(code, conditionEnd + 1);
        if (!stmtResult) {
            return undefined;
        }

        branches.push({
            statement,
            bodyStart: stmtResult.bodyStart,
            bodyEnd: stmtResult.bodyEnd,
        });

        cursor = skipWhitespace(code, stmtResult.nextStart);
        if (cursor >= code.length || !startsWithKeyword(code, cursor, 'else')) {
            return {
                branches,
                elseStart: null,
                elseEnd: null,
                end: cursor,
            };
        }

        cursor = skipWhitespace(code, cursor + 4);
        if (startsWithKeyword(code, cursor, 'if')) {
            continue;
        }

        if (cursor >= code.length || code[cursor] !== '{') {
            return undefined;
        }

        const elseStmt = parseStatement(code, cursor);
        if (!elseStmt) {
            return undefined;
        }

        return {
            branches,
            elseStart: elseStmt.bodyStart,
            elseEnd: elseStmt.bodyEnd,
            end: elseStmt.nextStart,
        };
    }

    return {
        branches,
        elseStart: null,
        elseEnd: null,
        end: cursor,
    };
}

function buildConditionalNode(
    code: string,
    data: ConditionalScanData | undefined,
): ConditionalNode | undefined {
    if (!data) {
        return undefined;
    }

    const branches: ConditionalBranch[] = data.branches.map((branch) => ({
        statement: branch.statement,
        code: parse(code.slice(branch.bodyStart, branch.bodyEnd)),
    }));

    let elseCode: AstNode[] | null = null;
    if (data.elseStart !== null && data.elseEnd !== null) {
        elseCode = parse(code.slice(data.elseStart, data.elseEnd));
    }

    return {
        type: 'conditional',
        branches,
        elseCode,
    };
}

function parseStatement(
    code: string,
    start: number,
): StatementResult | undefined {
    const cursor = skipWhitespace(code, start);
    if (cursor >= code.length) {
        return undefined;
    }

    if (code[cursor] === '{') {
        const blockEnd = findMatching(code, cursor, '{', '}');
        if (blockEnd === undefined) {
            return undefined;
        }

        return {
            bodyCode: code.slice(cursor + 1, blockEnd),
            bodyStart: cursor + 1,
            bodyEnd: blockEnd,
            nextStart: blockEnd + 1,
        };
    }

    // Only handle braced blocks; non-braced statements are not supported and fall
    // back to blob parsing so ambiguous minified code is preserved as-is.
    return undefined;
}

type CodeMode =
    | 'code'
    | 'single'
    | 'double'
    | 'template'
    | 'line-comment'
    | 'block-comment'
    | 'regex';

interface CodeState {
    mode: CodeMode;
    inRegexCharClass: boolean;
}

class CodeStateMachine {
    private readonly state: CodeState = {
        mode: 'code',
        inRegexCharClass: false,
    };
    private lastSignificant = '';
    private readonly code: string;

    constructor(code: string) {
        this.code = code;
    }

    // Single pass: emits blob segments (other/string/template/regex) and stops at
    // the first recognizable section returned by checkAt (in code mode).
    scanUntilSection(
        checkAt: (index: number) => ScanResult | undefined,
    ): ScanResult[] {
        const code = this.code;
        const results: ScanResult[] = [];
        let segStart = 0;
        let i = 0;

        while (i < code.length) {
            if (this.state.mode === 'code') {
                const section = checkAt(i);
                if (section) {
                    if (i > segStart) {
                        results.push({
                            kind: 'other',
                            code: code.slice(segStart, i),
                        });
                    }
                    results.push(section);
                    return results;
                }
            }

            const prevMode = this.state.mode;
            const nextIndex = this.advance(i);
            const currMode = this.state.mode;
            const end = (nextIndex !== i ? nextIndex : i) + 1;

            if (prevMode !== currMode) {
                if (prevMode === 'code' && currMode !== 'code') {
                    if (i > segStart) {
                        results.push({
                            kind: 'other',
                            code: code.slice(segStart, i),
                        });
                    }
                    segStart = i;
                } else if (prevMode !== 'code' && currMode === 'code') {
                    results.push({
                        kind: modeToScanKind(prevMode),
                        code: code.slice(segStart, end),
                    });
                    segStart = end;
                }
            }

            i = end;
        }

        if (segStart < code.length) {
            if (this.state.mode === 'code') {
                results.push({ kind: 'other', code: code.slice(segStart) });
            } else {
                results.push({
                    kind: modeToScanKind(this.state.mode),
                    code: code.slice(segStart),
                });
            }
        }

        return results;
    }

    scanCodeUntil(
        start: number,
        predicate: (index: number) => boolean,
    ): number | undefined {
        for (let i = start; i < this.code.length; i += 1) {
            const nextIndex = this.advance(i);
            if (nextIndex !== i) {
                i = nextIndex;
                continue;
            }

            if (this.state.mode === 'code' && predicate(i)) {
                return i;
            }
        }

        return undefined;
    }

    advance(index: number): number {
        const transition = this.advanceState(index);
        if (transition.consumeTo !== undefined) {
            if (transition.significant !== undefined) {
                this.lastSignificant = transition.significant;
            }
            return transition.consumeTo;
        }

        const ch = this.code[index];
        if (!isWhitespace(ch)) {
            this.lastSignificant = ch;
        }

        return index;
    }

    private advanceState(index: number): {
        consumeTo?: number;
        significant?: string;
    } {
        const ch = this.code[index];
        const next = index + 1 < this.code.length ? this.code[index + 1] : '';

        if (this.state.mode === 'code') {
            if (ch === '/' && next === '/') {
                this.state.mode = 'line-comment';
                return { consumeTo: index + 1 };
            }
            if (ch === '/' && next === '*') {
                this.state.mode = 'block-comment';
                return { consumeTo: index + 1 };
            }
            if (ch === "'") {
                this.state.mode = 'single';
                return {};
            }
            if (ch === '"') {
                this.state.mode = 'double';
                return {};
            }
            if (ch === '`') {
                this.state.mode = 'template';
                return {};
            }
            if (ch === '/' && isLikelyRegexStart(this.lastSignificant)) {
                this.state.mode = 'regex';
                this.state.inRegexCharClass = false;
                return {};
            }
            return {};
        }

        if (this.state.mode === 'line-comment') {
            if (isLineBreakChar(ch)) {
                this.state.mode = 'code';
                return { significant: '' };
            }
            return {};
        }

        if (this.state.mode === 'block-comment') {
            if (ch === '*' && next === '/') {
                this.state.mode = 'code';
                return { consumeTo: index + 1, significant: '' };
            }
            return {};
        }

        if (this.state.mode === 'single') {
            if (ch === '\\') {
                return { consumeTo: index + 1 };
            }
            if (ch === "'") {
                this.state.mode = 'code';
                return { significant: 'x' };
            }
            return {};
        }

        if (this.state.mode === 'double') {
            if (ch === '\\') {
                return { consumeTo: index + 1 };
            }
            if (ch === '"') {
                this.state.mode = 'code';
                return { significant: 'x' };
            }
            return {};
        }

        if (this.state.mode === 'template') {
            if (ch === '\\') {
                return { consumeTo: index + 1 };
            }
            if (ch === '`') {
                this.state.mode = 'code';
                return { significant: 'x' };
            }
            return {};
        }

        if (this.state.mode === 'regex') {
            if (ch === '\\') {
                return { consumeTo: index + 1 };
            }
            if (ch === '[') {
                this.state.inRegexCharClass = true;
                return {};
            }
            if (ch === ']') {
                this.state.inRegexCharClass = false;
                return {};
            }
            if (ch === '/' && !this.state.inRegexCharClass) {
                this.state.mode = 'code';
                return { significant: 'x' };
            }
            return {};
        }

        return {};
    }
}

function findMatching(
    code: string,
    start: number,
    openChar: string,
    closeChar: string,
): number | undefined {
    const codeState = new CodeStateMachine(code);
    let depth = 0;

    return codeState.scanCodeUntil(start, (i) => {
        const ch = code[i];
        if (ch === openChar) {
            depth += 1;
        } else if (ch === closeChar) {
            depth -= 1;
            if (depth === 0) {
                return true;
            }
        }
        return false;
    });
}

function scanBlanklineRun(code: string): number {
    let cursor = 0;
    let breakCount = 0;

    const firstBreakLength = lineBreakLengthAt(code, cursor);
    if (firstBreakLength === 0) {
        return 0;
    }

    cursor += firstBreakLength;
    breakCount += 1;

    while (cursor < code.length) {
        while (
            cursor < code.length &&
            (code[cursor] === ' ' || code[cursor] === '\t')
        ) {
            cursor += 1;
        }

        const nextBreakLength = lineBreakLengthAt(code, cursor);
        if (nextBreakLength === 0) {
            break;
        }

        cursor += nextBreakLength;
        breakCount += 1;
    }

    return breakCount >= 2 ? cursor : 0;
}

function countNewlines(code: string): number {
    let count = 0;
    let i = 0;

    while (i < code.length) {
        const breakLength = lineBreakLengthAt(code, i);
        if (breakLength > 0) {
            count += 1;
            i += breakLength;
            continue;
        }
        i += 1;
    }

    return count;
}

function skipWhitespace(code: string, start: number): number {
    let cursor = start;
    while (cursor < code.length && /\s/.test(code[cursor])) {
        cursor += 1;
    }
    return cursor;
}

function startsWithKeyword(
    code: string,
    index: number,
    keyword: string,
): boolean {
    if (!code.startsWith(keyword, index)) {
        return false;
    }

    if (index > 0 && isWordChar(code[index - 1])) {
        return false;
    }

    const afterIndex = index + keyword.length;
    return afterIndex >= code.length || !isWordChar(code[afterIndex]);
}

function isWordChar(value: string | undefined): boolean {
    return value !== undefined && /[A-Za-z0-9_$]/.test(value);
}

function modeToScanKind(mode: CodeMode): 'string' | 'template' | 'regex' {
    if (mode === 'single' || mode === 'double') {
        return 'string';
    }
    if (mode === 'template') {
        return 'template';
    }
    return 'regex';
}

function isLikelyRegexStart(prevSignificant: string): boolean {
    if (!prevSignificant) {
        return true;
    }
    return '([{:;,=!&|?+-*%^~<>'.includes(prevSignificant);
}

function isWhitespace(ch: string): boolean {
    return (
        ch === ' ' ||
        ch === '\t' ||
        ch === '\r' ||
        ch === '\n' ||
        ch === '\u2028' ||
        ch === '\u2029'
    );
}

function isLineBreakChar(ch: string | undefined): boolean {
    return ch === '\n' || ch === '\r' || ch === '\u2028' || ch === '\u2029';
}

function lineBreakLengthAt(code: string, index: number): number {
    const ch = code[index];
    const next = code[index + 1];

    if (ch === '\r' && next === '\n') {
        return 2;
    }

    if (isLineBreakChar(ch)) {
        return 1;
    }

    return 0;
}

function shiftConditionalData(
    data: ConditionalScanData,
    offset: number,
): ConditionalScanData {
    return {
        branches: data.branches.map((branch) => ({
            statement: branch.statement,
            bodyStart: branch.bodyStart + offset,
            bodyEnd: branch.bodyEnd + offset,
        })),
        elseStart: data.elseStart === null ? null : data.elseStart + offset,
        elseEnd: data.elseEnd === null ? null : data.elseEnd + offset,
        end: data.end + offset,
    };
}

function findLineCommentEnd(code: string, start: number): number {
    for (let i = start; i < code.length; i += 1) {
        if (lineBreakLengthAt(code, i) > 0) {
            return i;
        }
    }

    return code.length;
}

function mergeBlanklineNodes(nodes: AstNode[]): AstNode[] {
    const merged: AstNode[] = [];

    for (const node of nodes) {
        const previous = merged.at(-1);
        if (node.type === 'blankline' && previous?.type === 'blankline') {
            previous.count += node.count;
            continue;
        }

        merged.push(node);
    }

    return merged;
}
