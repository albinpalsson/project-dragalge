export type WhereOperator = '=' | 'in';
export type WhereClause =
    | { operator: '='; column: string; value: unknown }
    | { operator: 'in'; column: string; values: readonly unknown[] };
export type JoinClause = { table: string; lhs: string; rhs: string };

export function createWhereClause(
    column: string,
    operator: WhereOperator,
    value: unknown,
): WhereClause {
    if (operator === '=') {
        return { operator, column, value };
    }
    if (!Array.isArray(value)) {
        throw new Error('IN requires an array of values');
    }
    if (value.length === 0) {
        throw new Error('IN requires at least one value');
    }
    return { operator, column, values: value };
}

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
    const params: unknown[] = [];
    const predicates = wheres.map((where) => {
        if (where.operator === '=') {
            params.push(where.value);
            return `${q(where.column)} = ?`;
        }
        params.push(...where.values);
        return `${q(where.column)} in (${where.values.map(() => '?').join(', ')})`;
    });
    return { sql: `where ${predicates.join(' and ')}`, params };
}
