// Database Module
// SQL-first interface with executor pattern for future migration

type SQLValue = unknown;
type SQLRow = Record<string, SQLValue>;

// ===== Executor Interface (Abstract - enables backend swapping) =====
export interface SQLExecutor {
	// Execute raw SQL with parameterized values
	execute(sql: string, params?: SQLValue[]): ExecuteResult;

	// Prepare statement for repeated execution
	prepare(sql: string): PreparedStatement;

	// Transaction support (optional for V1)
	begin?(): void;
	commit?(): void;
	rollback?(): void;
}

export interface ExecuteResult {
	changes: number; // For INSERT/UPDATE/DELETE
	lastInsertRowid?: number; // For INSERT
	rows?: SQLRow[]; // For SELECT
}

export interface PreparedStatement {
	bind(params: SQLValue[]): this;
	all(): SQLRow[];
	get(): SQLRow | undefined;
	run(): ExecuteResult;
	reset(): void;
}

// ===== Schema & Query Types =====
export interface TableSchema {
	[columnName: string]: "string" | "number" | "boolean" | "date";
}

export interface WhereClause {
	conditions: Array<{
		column: string;
		operator: "=" | ">" | "<" | ">=" | "<=" | "IN" | "LIKE";
		value: SQLValue;
	}>;
	logic: "AND";
}

// ===== Main DB Class =====
export class DB {
	private executor: SQLExecutor;
	private changeListeners: ((table: string) => void)[] = [];

	constructor(executor: SQLExecutor) {
		this.executor = executor;
	}

	// ===== Raw SQL Interface (Primary) =====
	execute(sql: string, params?: SQLValue[]): ExecuteResult {
		const result = this.executor.execute(sql, params);
		// Emit change event for write operations
		if (
			sql.trim().toUpperCase().startsWith("INSERT") ||
			sql.trim().toUpperCase().startsWith("UPDATE") ||
			sql.trim().toUpperCase().startsWith("DELETE")
		) {
			// Extract table name (simplified - real implementation would parse properly)
			this.changeListeners.forEach((cb) => {
				cb("*");
			});
		}
		return result;
	}

	prepare(sql: string): PreparedStatement {
		return this.executor.prepare(sql);
	}

	// ===== High-Level Convenience Methods =====
	createTable(name: string, schema: TableSchema, primaryKey?: string): void {
		const columns = Object.entries(schema)
			.map(
				([col, type]) =>
					`${col} ${type}${col === primaryKey ? " PRIMARY KEY" : ""}`,
			)
			.join(", ");
		this.execute(`CREATE TABLE IF NOT EXISTS ${name} (${columns})`);
	}

	insert(table: string, row: SQLRow): void {
		const columns = Object.keys(row);
		const placeholders = columns.map(() => "?").join(", ");
		const sql = `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})`;
		this.execute(sql, Object.values(row));
	}

	select(
		table: string,
		where?: WhereClause,
		orderBy?: { column: string; asc: boolean },
		limit?: number,
	): SQLRow[] {
		let sql = `SELECT * FROM ${table}`;
		const params: SQLValue[] = [];

		if (where) {
			const whereStr = where.conditions
				.map((cond) => {
					params.push(cond.value);
					return `${cond.column} ${cond.operator} ?`;
				})
				.join(` ${where.logic} `);
			sql += ` WHERE ${whereStr}`;
		}

		if (orderBy) {
			sql += ` ORDER BY ${orderBy.column} ${orderBy.asc ? "ASC" : "DESC"}`;
		}

		if (limit) {
			sql += ` LIMIT ${limit}`;
		}

		const result = this.execute(sql, params);
		return result.rows ?? [];
	}

	update(table: string, set: SQLRow, where: WhereClause): number {
		const setClauses = Object.keys(set)
			.map(() => "? = ?")
			.join(", ");
		const params: SQLValue[] = [];

		Object.entries(set).forEach(([k, v]) => {
			params.push(k, v);
		});

		let sql = `UPDATE ${table} SET ${setClauses}`;

		if (where) {
			const whereStr = where.conditions
				.map((cond) => {
					params.push(cond.value);
					return `${cond.column} ${cond.operator} ?`;
				})
				.join(` ${where.logic} `);
			sql += ` WHERE ${whereStr}`;
		}

		const result = this.execute(sql, params);
		return result.changes;
	}

	delete(table: string, where: WhereClause): number {
		const params: SQLValue[] = [];
		const whereStr = where.conditions
			.map((cond) => {
				params.push(cond.value);
				return `${cond.column} ${cond.operator} ?`;
			})
			.join(` ${where.logic} `);

		const sql = `DELETE FROM ${table} WHERE ${whereStr}`;
		const result = this.execute(sql, params);
		return result.changes;
	}

	// ===== Persistence & Events =====
	export(): Uint8Array {
		// Implementation will follow
		return new Uint8Array();
	}

	import(_data: Uint8Array): void {
		// Implementation will follow
	}

	onChange(callback: (table: string) => void): void {
		this.changeListeners.push(callback);
	}

	// ===== Executor Swapping (for future backend migration) =====
	setExecutor(executor: SQLExecutor): void {
		this.executor = executor;
	}
}
