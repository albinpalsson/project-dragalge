import type { ColumnInput } from './types.ts';

export type WhereClause =
    | { type: 'equals'; column: string }
    | { type: 'in'; column: string; parameterCount: number };
export interface JoinClause {
    table: string;
    leftCol: string;
    rightCol: string;
}

export interface ParsedSelect {
    type: 'select';
    table: string;
    join?: JoinClause;
    wheres: WhereClause[];
}

export interface ParsedInsert {
    type: 'insert';
    table: string;
    columns: string[];
    rowCount: number;
}

export interface ParsedUpdate {
    type: 'update';
    table: string;
    setCols: string[];
    wheres: WhereClause[];
}

export interface ParsedDelete {
    type: 'delete';
    table: string;
    wheres: WhereClause[];
}

export interface ParsedCreateTable {
    type: 'createTable';
    table: string;
    columns: ColumnInput[];
}

export type ParsedStatement =
    | ParsedSelect
    | ParsedInsert
    | ParsedUpdate
    | ParsedDelete
    | ParsedCreateTable;

function tokenize(sql: string): string[] {
    const tokens: string[] = [];
    let i = 0;
    while (i < sql.length) {
        const ch = sql[i];
        if (/\s/.test(ch)) {
            i++;
            continue;
        }
        // quoted identifier: read until closing "
        if (ch === '"') {
            const end = sql.indexOf('"', i + 1);
            if (end === -1) {
                throw new Error('Unterminated quoted identifier');
            }
            tokens.push(sql.slice(i + 1, end)); // strip quotes
            i = end + 1;
            continue;
        }
        if (
            ch === '(' ||
            ch === ')' ||
            ch === ',' ||
            ch === '=' ||
            ch === '*'
        ) {
            tokens.push(ch);
            i++;
            continue;
        }
        // plain token: read until whitespace or punctuation
        let j = i;
        while (j < sql.length && !/[\s"(),=*]/.test(sql[j])) {
            j++;
        }
        tokens.push(sql.slice(i, j));
        i = j;
    }
    return tokens;
}

class Parser {
    private pos = 0;
    private readonly tokens: string[];

    constructor(tokens: string[]) {
        this.tokens = tokens;
    }

    peek(): string {
        return (this.tokens[this.pos] ?? '').toUpperCase();
    }
    raw(): string {
        return this.tokens[this.pos] ?? '';
    }

    expect(keyword: string): void {
        if (this.peek() !== keyword.toUpperCase()) {
            throw new Error(
                `Expected ${keyword}, got ${this.raw() || 'end of input'}`,
            );
        }
        this.pos++;
    }

    consume(): string {
        const t = this.raw();
        if (!t) {
            throw new Error('Unexpected end of input');
        }
        this.pos++;
        return t;
    }

    skip(token: string): void {
        if (this.peek() === token.toUpperCase()) {
            this.pos++;
        }
    }

    done(): boolean {
        return this.pos >= this.tokens.length;
    }
}

export function parse(sql: string): ParsedStatement {
    const tokens = tokenize(sql);
    const p = new Parser(tokens);
    const keyword = p.peek();

    if (keyword === 'SELECT') {
        p.expect('SELECT');
        p.expect('*');
        p.expect('FROM');
        const table = p.consume();
        let join: JoinClause | undefined;
        if (p.peek() === 'INNER') {
            p.expect('INNER');
            p.expect('JOIN');
            const joinTable = p.consume();
            p.expect('ON');
            const lhs = p.consume();
            p.expect('=');
            const rhs = p.consume();
            const [lhsTable, lhsCol] = lhs.split('.');
            const [, rhsCol] = rhs.split('.');
            // determine which side belongs to the FROM table
            const leftCol = lhsTable === table ? lhsCol : rhsCol;
            const rightCol = lhsTable === table ? rhsCol : lhsCol;
            join = { table: joinTable, leftCol, rightCol };
        }
        const wheres = parseWhere(p);
        return { type: 'select', table, join, wheres };
    }

    if (keyword === 'INSERT') {
        p.expect('INSERT');
        p.expect('INTO');
        const table = p.consume();
        p.expect('(');
        const columns: string[] = [];
        while (p.peek() !== ')') {
            columns.push(p.consume());
            p.skip(',');
        }
        p.expect(')');
        p.expect('VALUES');

        let rowCount = 0;
        do {
            p.expect('(');
            const valueCount = parseInsertTupleValueCount(p);
            p.expect(')');
            if (valueCount !== columns.length) {
                throw new Error(
                    `INSERT tuple size ${valueCount} does not match column count ${columns.length}`,
                );
            }
            rowCount++;
            if (p.peek() !== ',') {
                break;
            }
            p.expect(',');
        } while (!p.done());

        if (rowCount === 0) {
            throw new Error('INSERT requires at least one VALUES tuple');
        }

        return { type: 'insert', table, columns, rowCount };
    }

    if (keyword === 'UPDATE') {
        p.expect('UPDATE');
        const table = p.consume();
        p.expect('SET');
        const setCols: string[] = [];
        while (!p.done() && p.peek() !== 'WHERE') {
            setCols.push(p.consume());
            p.expect('=');
            p.expect('?');
            p.skip(',');
        }
        const wheres = parseWhere(p);
        return { type: 'update', table, setCols, wheres };
    }

    if (keyword === 'DELETE') {
        p.expect('DELETE');
        p.expect('FROM');
        const table = p.consume();
        const wheres = parseWhere(p);
        return { type: 'delete', table, wheres };
    }

    if (keyword === 'CREATE') {
        p.expect('CREATE');
        p.expect('TABLE');
        const table = p.consume();
        p.expect('(');
        const columns: ColumnInput[] = [];
        while (p.peek() !== ')') {
            const colName = p.consume();
            columns.push(parseColumnType(p, colName));
            p.skip(',');
        }
        p.expect(')');
        return { type: 'createTable', table, columns };
    }

    throw new Error(`Unsupported SQL: ${sql}`);
}

function parseInsertTupleValueCount(p: Parser): number {
    let count = 0;
    while (p.peek() !== ')') {
        p.consume();
        count++;
        if (p.peek() === ',') {
            p.expect(',');
        } else if (p.peek() !== ')') {
            throw new Error(
                `Expected , or ), got ${p.raw() || 'end of input'}`,
            );
        }
    }
    return count;
}

function parseColumnType(p: Parser, colName: string): ColumnInput {
    const token = p.peek();

    if (token === 'INT' || token === 'INTEGER') {
        p.consume();
        return { name: colName, type: 'int32' };
    }

    if (token === 'TINYINT') {
        p.consume();
        return { name: colName, type: 'uint8' };
    }

    if (token === 'BOOLEAN' || token === 'BOOL') {
        p.consume();
        return { name: colName, type: 'boolean' };
    }

    if (token === 'TIMESTAMP') {
        p.consume();
        return { name: colName, type: 'timestamp' };
    }

    if (token === 'CHAR') {
        p.consume();
        p.expect('(');
        const length = Number.parseInt(p.consume(), 10);
        if (!Number.isFinite(length) || length <= 0) {
            throw new Error('Invalid CHAR length');
        }
        p.expect(')');
        return { name: colName, type: 'char', length };
    }

    throw new Error(`Unknown column type: ${p.raw() || 'end of input'}`);
}

function parseWhere(p: Parser): WhereClause[] {
    if (p.peek() !== 'WHERE') {
        return [];
    }
    p.expect('WHERE');
    const wheres: WhereClause[] = [];
    while (!p.done()) {
        const column = p.consume();
        if (p.peek() === '=') {
            p.expect('=');
            p.expect('?');
            wheres.push({ type: 'equals', column });
        } else if (p.peek() === 'IN') {
            p.expect('IN');
            p.expect('(');
            let parameterCount = 0;
            if (p.peek() === ')') {
                throw new Error('IN requires at least one placeholder');
            }
            while (true) {
                p.expect('?');
                parameterCount++;
                if (p.peek() === ')') {
                    break;
                }
                p.expect(',');
            }
            p.expect(')');
            wheres.push({ type: 'in', column, parameterCount });
        } else {
            throw new Error(
                `Expected = or IN, got ${p.raw() || 'end of input'}`,
            );
        }
        if (p.done()) {
            break;
        }
        p.expect('AND');
    }
    return wheres;
}
