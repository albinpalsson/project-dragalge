import type { CompiledQuery, DbClient, Insertable } from './types.ts'
import { q } from './utils.ts'
import { QueryBuilderBase } from './base.ts'

export class InsertQueryBuilder<DB, T extends keyof DB> extends QueryBuilderBase<DB, T> {
	private readonly _rows: Record<string, unknown>[]

	constructor(client: DbClient, table: T, rows: Record<string, unknown>[] = []) {
		super(client, table)
		this._rows = rows
	}

	values(rows: Insertable<DB[T]> | Insertable<DB[T]>[]): InsertQueryBuilder<DB, T> {
		const normalised = (Array.isArray(rows) ? rows : [rows]) as Record<string, unknown>[]
		return new InsertQueryBuilder(this._client, this._table, normalised)
	}

	compile(): CompiledQuery {
		const columns = Object.keys(this._rows[0] ?? {})
		const colList = columns.map(q).join(', ')
		const rowPlaceholders = columns.map(() => '?').join(', ')
		const valueClauses = this._rows.map(() => `(${rowPlaceholders})`).join(', ')
		const parameters = this._rows.flatMap((row) => columns.map((col) => row[col]))
		return {
			sql: `insert into ${q(this._table as string)} (${colList}) values ${valueClauses}`,
			parameters,
		}
	}

	async execute(): Promise<void> {
		const { sql, parameters } = this.compile()
		await this._client.execute(sql, parameters)
	}
}
