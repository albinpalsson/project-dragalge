import type { DbClient } from './types.ts'
import { SelectQueryBuilder } from './select.ts'
import { InsertQueryBuilder } from './insert.ts'
import { UpdateQueryBuilder } from './update.ts'
import { DeleteQueryBuilder } from './delete.ts'

export class Database<DB> {
	private readonly client: DbClient

	constructor(client: DbClient) {
		this.client = client
	}

	selectFrom<T extends keyof DB & string>(table: T): SelectQueryBuilder<DB, T> {
		return new SelectQueryBuilder<DB, T>(this.client, table)
	}

	insertInto<T extends keyof DB & string>(table: T): InsertQueryBuilder<DB, T> {
		return new InsertQueryBuilder<DB, T>(this.client, table)
	}

	updateTable<T extends keyof DB & string>(table: T): UpdateQueryBuilder<DB, T> {
		return new UpdateQueryBuilder<DB, T>(this.client, table)
	}

	deleteFrom<T extends keyof DB & string>(table: T): DeleteQueryBuilder<DB, T> {
		return new DeleteQueryBuilder<DB, T>(this.client, table)
	}
}

export function createDb<DB>(client: DbClient): Database<DB> {
	return new Database<DB>(client)
}
