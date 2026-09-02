import { QueryBuilderBase } from './base.ts';
import type { CompiledQuery, DbClient } from './types.ts';
import type { WhereClause, WhereOperator } from './utils.ts';
import { buildWhereClause, createWhereClause, q } from './utils.ts';

export class DeleteQueryBuilder<
    DB,
    T extends keyof DB,
> extends QueryBuilderBase<DB, T> {
    private readonly _wheres: WhereClause[];

    constructor(client: DbClient, table: T, wheres: WhereClause[] = []) {
        super(client, table);
        this._wheres = wheres;
    }

    where(
        column: string,
        operator: '=',
        value: unknown,
    ): DeleteQueryBuilder<DB, T>;
    where(
        column: string,
        operator: 'in',
        values: readonly unknown[],
    ): DeleteQueryBuilder<DB, T>;
    where(
        column: string,
        operator: WhereOperator,
        value: unknown,
    ): DeleteQueryBuilder<DB, T> {
        return new DeleteQueryBuilder(this._client, this._table, [
            ...this._wheres,
            createWhereClause(column, operator, value),
        ]);
    }

    compile(): CompiledQuery {
        const { sql: whereSql, params } = buildWhereClause(this._wheres);
        const sql = `delete from ${q(this._table as string)}${whereSql ? ` ${whereSql}` : ''}`;
        return { sql, parameters: params };
    }

    async execute(): Promise<void> {
        const { sql, parameters } = this.compile();
        await this._client.execute(sql, parameters);
    }
}
