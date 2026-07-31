// Database Module
// SQL-first interface with executor pattern for future migration

// ===== Executor Interface (Abstract - enables backend swapping) =====
export interface SQLExecutor {
  // Execute raw SQL with parameterized values
  execute(sql: string, params?: any[]): ExecuteResult;
  
  // Prepare statement for repeated execution
  prepare(sql: string): PreparedStatement;
  
  // Transaction support (optional for V1)
  begin?(): void;
  commit?(): void;
  rollback?(): void;
}

export interface ExecuteResult {
  changes: number;           // For INSERT/UPDATE/DELETE
  lastInsertRowid?: number;  // For INSERT
  rows?: Record<string, any>[]; // For SELECT
}

export interface PreparedStatement {
  bind(params: any[]): this;
  all(): Record<string, any>[];
  get(): Record<string, any> | undefined;
  run(): ExecuteResult;
  reset(): void;
}

// ===== Schema & Query Types =====
export interface TableSchema {
  [columnName: string]: 'string' | 'number' | 'boolean' | 'date';
}

export interface WhereClause {
  conditions: Array<{
    column: string;
    operator: '=' | '>' | '<' | '>=' | '<=' | 'IN' | 'LIKE';
    value: any;
  }>;
  logic: 'AND';
}

// ===== Main DB Class =====
export class DB {
  private executor: SQLExecutor;
  private changeListeners: ((table: string) => void)[] = [];

  constructor(executor: SQLExecutor) {
    this.executor = executor;
  }

  // ===== Raw SQL Interface (Primary) =====
  execute(sql: string, params?: any[]): ExecuteResult {
    const result = this.executor.execute(sql, params);
    // Emit change event for write operations
    if (sql.trim().toUpperCase().startsWith('INSERT') ||
        sql.trim().toUpperCase().startsWith('UPDATE') ||
        sql.trim().toUpperCase().startsWith('DELETE')) {
      // Extract table name (simplified - real implementation would parse properly)
      this.changeListeners.forEach(cb => cb('*'));
    }
    return result;
  }

  prepare(sql: string): PreparedStatement {
    return this.executor.prepare(sql);
  }

  // ===== High-Level Convenience Methods =====
  createTable(name: string, schema: TableSchema, primaryKey?: string): void {
    const columns = Object.entries(schema)
      .map(([col, type]) => `${col} ${type}${col === primaryKey ? ' PRIMARY KEY' : ''}`)
      .join(', ');
    this.execute(`CREATE TABLE IF NOT EXISTS ${name} (${columns})`);
  }

  insert(table: string, row: Record<string, any>): void {
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
    this.execute(sql, Object.values(row));
  }

  select(
    table: string,
    where?: WhereClause,
    orderBy?: { column: string; asc: boolean },
    limit?: number
  ): Record<string, any>[] {
    let sql = `SELECT * FROM ${table}`;
    const params: any[] = [];

    if (where) {
      const whereStr = where.conditions
        .map((cond, i) => {
          params.push(cond.value);
          return `${cond.column} ${cond.operator} ?`;
        })
        .join(` ${where.logic} `);
      sql += ` WHERE ${whereStr}`;
    }

    if (orderBy) {
      sql += ` ORDER BY ${orderBy.column} ${orderBy.asc ? 'ASC' : 'DESC'}`;
    }

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    const result = this.execute(sql, params);
    return result.rows || [];
  }

  update(table: string, set: Record<string, any>, where: WhereClause): number {
    const setClauses = Object.keys(set).map(() => '? = ?').join(', ');
    const params: any[] = [];

    Object.entries(set).forEach(([k, v]) => {
      params.push(k, v);
    });

    let sql = `UPDATE ${table} SET ${setClauses}`;

    if (where) {
      const whereStr = where.conditions
        .map(cond => {
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
    const params: any[] = [];
    const whereStr = where.conditions
      .map(cond => {
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

  import(data: Uint8Array): void {
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
