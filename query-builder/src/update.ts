import { QueryBuilderBase } from './base.ts';
import type { CompiledQuery, DbClient, Updateable } from './types.ts';
import type { WhereClause, WhereOperator } from './utils.ts';
import { buildWhereClause, createWhereClause, q } from './utils.ts';

export class UpdateQueryBuilder<
    DB,
    T extends keyof DB,
> extends QueryBuilderBase<DB, T> {
    private readonly _set: Record<string, unknown>;
    private readonly _wheres: WhereClause[];

    constructor(
        client: DbClient,
        table: T,
        set: Record<string, unknown> = {},
        wheres: WhereClause[] = [],
    ) {
        super(client, table);
        this._set = set;
        this._wheres = wheres;
    }

    set(values: Updateable<DB[T]>): UpdateQueryBuilder<DB, T> {
        return new UpdateQueryBuilder(
            this._client,
            this._table,
            values as Record<string, unknown>,
            this._wheres,
        );
    }

    where(
        column: string,
        operator: '=',
        value: unknown,
    ): UpdateQueryBuilder<DB, T>;
    where(
        column: string,
        operator: 'in',
        values: readonly unknown[],
    ): UpdateQueryBuilder<DB, T>;
    where(
        column: string,
        operator: WhereOperator,
        value: unknown,
    ): UpdateQueryBuilder<DB, T> {
        return new UpdateQueryBuilder(this._client, this._table, this._set, [
            ...this._wheres,
            createWhereClause(column, operator, value),
        ]);
    }

    compile(): CompiledQuery {
        const setClauses = Object.keys(this._set)
            .map((col) => `${q(col)} = ?`)
            .join(', ');
        const { sql: whereSql, params: whereParams } = buildWhereClause(
            this._wheres,
        );
        const sql = `update ${q(this._table as string)} set ${setClauses}${whereSql ? ` ${whereSql}` : ''}`;
        return {
            sql,
            parameters: [...Object.values(this._set), ...whereParams],
        };
    }

    async execute(): Promise<unknown[]> {
        const { sql, parameters } = this.compile();
        return await this._client.execute(sql, parameters);
    }
}
