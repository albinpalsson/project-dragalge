import type { DbClient } from './types.ts'

export class QueryBuilderBase<DB, T extends keyof DB> {
	protected readonly _client: DbClient
	protected readonly _table: T

	constructor(client: DbClient, table: T) {
		this._client = client
		this._table = table
	}
}
