export interface CompiledQuery {
	sql: string
	parameters: readonly unknown[]
}

export interface DbClient {
	execute(sql: string, parameters: readonly unknown[]): Promise<unknown[]>
}

export type Selectable<T> = T
export type Insertable<T> = T
export type Updateable<T> = Partial<T>
