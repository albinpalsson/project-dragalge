import { QueryBuilderBase } from './base.ts';
import type { CompiledQuery, DbClient, Selectable } from './types.ts';
import type { JoinClause, WhereClause } from './utils.ts';
import { buildWhereClause, q } from './utils.ts';

export class SelectQueryBuilder<
    DB,
    T extends keyof DB,
> extends QueryBuilderBase<DB, T> {
    private readonly _wheres: WhereClause[];
    private readonly _join: JoinClause | undefined;

    constructor(
        client: DbClient,
        table: T,
        wheres: WhereClause[] = [],
        join?: JoinClause,
    ) {
        super(client, table);
        this._wheres = wheres;
        this._join = join;
    }

    selectAll(): SelectQueryBuilder<DB, T> {
        return this;
    }

    where(column: string, _op: '=', value: unknown): SelectQueryBuilder<DB, T> {
        return new SelectQueryBuilder(
            this._client,
            this._table,
            [...this._wheres, { column, value }],
            this._join,
        );
    }

    innerJoin(
        table: string,
        lhs: string,
        rhs: string,
    ): SelectQueryBuilder<DB, T> {
        return new SelectQueryBuilder(this._client, this._table, this._wheres, {
            table,
            lhs,
            rhs,
        });
    }

    compile(): CompiledQuery {
        const parts: string[] = [`select * from ${q(this._table as string)}`];
        if (this._join) {
            parts.push(
                `inner join ${q(this._join.table)} on ${q(this._join.lhs)} = ${q(this._join.rhs)}`,
            );
        }
        const { sql: whereSql, params } = buildWhereClause(this._wheres);
        if (whereSql) {
            parts.push(whereSql);
        }
        return { sql: parts.join(' '), parameters: params };
    }

    async execute(): Promise<Selectable<DB[T]>[]> {
        const { sql, parameters } = this.compile();
        return this._client.execute(sql, parameters) as Promise<
            Selectable<DB[T]>[]
        >;
    }

    async executeTakeFirst(): Promise<Selectable<DB[T]> | undefined> {
        return (await this.execute())[0];
    }
}
