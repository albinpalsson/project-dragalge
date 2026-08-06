export type WhereClause = { column: string; value: unknown };
export type JoinClause = { table: string; lhs: string; rhs: string };

export function q(identifier: string): string {
    return identifier
        .split('.')
        .map((part) => `"${part}"`)
        .join('.');
}

export function buildWhereClause(wheres: WhereClause[]): {
    sql: string;
    params: unknown[];
} {
    if (wheres.length === 0) {
        return { sql: '', params: [] };
    }
    const sql = `where ${wheres.map(({ column }) => `${q(column)} = ?`).join(' and ')}`;
    return { sql, params: wheres.map(({ value }) => value) };
}
