import {
    columnByteWidth,
    copySlot,
    decodeRow,
    decodeValue,
    encodeRow,
    encodeValue,
} from './binary-codec.ts';
import { decodeBlob, encodeBlob } from './persistence.ts';
import type { JoinClause, WhereClause } from './sql-parser.ts';
import { parse } from './sql-parser.ts';
import type {
    ColumnDefinition,
    ColumnInput,
    StoragePlugin,
    TableSchema,
    TableStorage,
    TableInfo,
} from './types.ts';
import { HEADER_BYTES } from './types.ts';

interface DBOptions {
    growthFactor?: number;
}

type BoundWhereClause =
    | { type: 'equals'; column: string; value: unknown }
    | { type: 'in'; column: string; values: ReadonlySet<unknown> };

function makeSchema(columns: ColumnInput[]): TableSchema {
    let offset = 1; // byte 0 is the status byte
    const resolved: ColumnDefinition[] = columns.map((col) => {
        let c: ColumnDefinition;
        switch (col.type) {
            case 'char':
                c = { ...col, offset };
                break;
            case 'int32':
            case 'uint8':
            case 'boolean':
            case 'timestamp':
                c = { ...col, offset };
                break;
        }
        offset += columnByteWidth(c);
        return c;
    });
    return { columns: resolved, rowSize: offset };
}

function allocateBuffer(
    rowSize: number,
    capacity: number,
): { buffer: ArrayBuffer; view: DataView } {
    const buffer = new ArrayBuffer(HEADER_BYTES + rowSize * capacity);
    const view = new DataView(buffer);
    view.setUint32(0, 0, true); // rowCount
    view.setUint32(4, capacity, true); // rowCapacity
    return { buffer, view };
}

function growBuffer(table: TableStorage, growthFactor: number): void {
    const oldCapacity = table.view.getUint32(4, true);
    const scaledCapacity = Math.floor(oldCapacity * growthFactor);
    const newCapacity = Math.max(oldCapacity + 1, scaledCapacity);
    const { buffer, view } = allocateBuffer(table.schema.rowSize, newCapacity);
    new Uint8Array(buffer).set(
        new Uint8Array(
            table.buffer,
            0,
            HEADER_BYTES + oldCapacity * table.schema.rowSize,
        ),
    );
    view.setUint32(4, newCapacity, true);
    table.buffer = buffer;
    table.view = view;
}

export class DB {
    private tables = new Map<string, TableStorage>();
    private storage: StoragePlugin | undefined;
    private writeTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly growthFactor: number;
    // keyed by "tableName.columnName"; invalidated on any write to that table
    private joinIndexCache = new Map<string, Map<unknown, number[]>>();

    constructor(storage?: StoragePlugin, options?: DBOptions) {
        this.storage = storage;
        this.growthFactor = options?.growthFactor ?? 2;
    }

    private createTableInternal(name: string, columns: ColumnInput[]): void {
        if (this.tables.has(name)) {
            throw new Error(`Table "${name}" already exists`);
        }
        const resolved = makeSchema(columns);
        const { buffer, view } = allocateBuffer(resolved.rowSize, 1);
        this.tables.set(name, { name, schema: resolved, buffer, view });
    }

    execute(
        sql: string,
        parameters: readonly unknown[],
    ): Record<string, unknown>[] {
        try {
            return this.tryRunQuery(sql, parameters);
        } catch (e) {
            throw new Error(
                `Query failed: ${getErrorMessage(e)}. Query: ${sql} Par: ${JSON.stringify(parameters)}`,
                { cause: e },
            );
        }
    }

    private tryRunQuery(sql: string, parameters: readonly unknown[]) {
        const stmt = parse(sql);

        if (stmt.type === 'select') {
            const table = this.getTable(stmt.table);
            const wheres = this.bindWhere(stmt.wheres, parameters);
            if (stmt.join) {
                return this.executeJoinSelect(table, stmt.join, wheres);
            }
            return this.executeSelect(table, wheres);
        }

        if (stmt.type === 'insert') {
            const table = this.getTable(stmt.table);

            const valuesPerRow = stmt.columns.length;
            const expectedParamCount = valuesPerRow * stmt.rowCount;
            if (parameters.length !== expectedParamCount) {
                throw new Error(
                    `INSERT expected ${expectedParamCount} parameters, got ${parameters.length}`,
                );
            }

            for (let row = 0; row < stmt.rowCount; row++) {
                const rowOffset = row * valuesPerRow;
                const values: Record<string, unknown> = {};
                stmt.columns.forEach((col, i) => {
                    values[col] = parameters[rowOffset + i];
                });
                this.insertRow(table, values);
            }

            this.scheduleWrite();
            return [];
        }

        if (stmt.type === 'update') {
            const table = this.getTable(stmt.table);
            const affectedRows = this.executeUpdate(
                table,
                stmt.setCols,
                parameters,
                stmt.wheres,
            );
            this.scheduleWrite();
            return affectedRows;
        }

        if (stmt.type === 'delete') {
            const table = this.getTable(stmt.table);
            this.executeDelete(table, this.bindWhere(stmt.wheres, parameters));
            this.scheduleWrite();
            return [];
        }

        if (stmt.type === 'createTable') {
            this.createTableInternal(stmt.table, stmt.columns);
            this.scheduleWrite();
            return [];
        }

        throw new Error('Unsupported statement');
    }

    async save(): Promise<void> {
        if (!this.storage) {
            return;
        }
        if (this.writeTimer !== null) {
            clearTimeout(this.writeTimer);
            this.writeTimer = null;
        }
        await this.storage.write(encodeBlob(this.tables));
    }

    async load(): Promise<boolean> {
        if (!this.storage) {
            return false;
        }
        const blob = await this.storage.read();
        if (!blob) {
            return false;
        }
        this.tables = decodeBlob(blob);
        return true;
    }

    describeTables(): TableInfo[] {
        const result: TableInfo[] = [];
        for (const [, table] of this.tables) {
            const rowCount = table.view.getUint32(0, true);
            result.push({
                name: table.name,
                columns: table.schema.columns,
                rowCount,
            });
        }
        return result;
    }

    private scheduleWrite(): void {
        if (!this.storage) {
            return;
        }
        if (this.writeTimer !== null) {
            clearTimeout(this.writeTimer);
        }
        this.writeTimer = setTimeout(() => {
            this.writeTimer = null;
            void this.storage?.write(encodeBlob(this.tables));
        }, 50);
    }

    private getTable(name: string): TableStorage {
        const table = this.tables.get(name);
        if (!table) {
            throw new Error(`Unknown table "${name}"`);
        }
        return table;
    }

    private executeSelect(
        table: TableStorage,
        wheres: BoundWhereClause[],
    ): Record<string, unknown>[] {
        const rowCount = table.view.getUint32(0, true);
        const result: Record<string, unknown>[] = [];
        for (let i = 0; i < rowCount; i++) {
            if (this.matchesWhere(table, i, wheres)) {
                result.push(decodeRow(table, i));
            }
        }
        return result;
    }

    private executeJoinSelect(
        leftTable: TableStorage,
        join: JoinClause,
        wheres: BoundWhereClause[],
    ): Record<string, unknown>[] {
        const rightTable = this.getTable(join.table);
        const leftCount = leftTable.view.getUint32(0, true);
        const rightCount = rightTable.view.getUint32(0, true);
        const leftJoinCol = this.getColumn(leftTable, join.leftCol);
        const rightJoinCol = this.getColumn(rightTable, join.rightCol);
        const cacheKey = `${rightTable.name}.${join.rightCol}`;
        let rightIndexByKey = this.joinIndexCache.get(cacheKey);
        if (!rightIndexByKey) {
            rightIndexByKey = new Map<unknown, number[]>();
            for (let j = 0; j < rightCount; j++) {
                const rightSlotOffset =
                    HEADER_BYTES + j * rightTable.schema.rowSize;
                const key = decodeValue(
                    rightTable.view,
                    rightSlotOffset + rightJoinCol.offset,
                    rightJoinCol,
                );
                const bucket = rightIndexByKey.get(key);
                if (bucket) {
                    bucket.push(j);
                } else {
                    rightIndexByKey.set(key, [j]);
                }
            }
            this.joinIndexCache.set(cacheKey, rightIndexByKey);
        }

        const result: Record<string, unknown>[] = [];
        const rightRowCache = new Map<number, Record<string, unknown>>();
        for (let i = 0; i < leftCount; i++) {
            const leftSlotOffset = HEADER_BYTES + i * leftTable.schema.rowSize;
            const leftKey = decodeValue(
                leftTable.view,
                leftSlotOffset + leftJoinCol.offset,
                leftJoinCol,
            );
            const matchingRightIndexes = rightIndexByKey.get(leftKey);
            if (!matchingRightIndexes || matchingRightIndexes.length === 0) {
                continue;
            }

            const leftRow = decodeRow(leftTable, i);
            for (const j of matchingRightIndexes) {
                let rightRow = rightRowCache.get(j);
                if (!rightRow) {
                    rightRow = decodeRow(rightTable, j);
                    rightRowCache.set(j, rightRow);
                }
                const merged = { ...leftRow, ...rightRow };
                if (this.matchesWhereObject(merged, wheres)) {
                    result.push(merged);
                }
            }
        }
        return result;
    }

    private executeUpdate(
        table: TableStorage,
        setCols: string[],
        params: readonly unknown[],
        wheres: WhereClause[],
    ) {
        if (params.length < setCols.length) {
            throw new Error(
                `UPDATE expected at least ${setCols.length} parameters, got ${params.length}`,
            );
        }
        const whereParams = params.slice(setCols.length);
        const boundWheres = this.bindWhere(wheres, whereParams);
        const setColumns = setCols.map((colName) =>
            this.getColumn(table, colName),
        );
        const rowCount = table.view.getUint32(0, true);
        const affectedRows = [];
        for (let i = 0; i < rowCount; i++) {
            if (this.matchesWhere(table, i, boundWheres)) {
                affectedRows.push({});
                const slotOffset = HEADER_BYTES + i * table.schema.rowSize;
                for (let ci = 0; ci < setColumns.length; ci++) {
                    const col = setColumns[ci];
                    encodeValue(
                        table.view,
                        slotOffset + col.offset,
                        col,
                        params[ci],
                    );
                }
            }
        }
        this.invalidateTableIndexes(table.name);
        return affectedRows;
    }

    private executeDelete(
        table: TableStorage,
        wheres: BoundWhereClause[],
    ): void {
        let rowCount = table.view.getUint32(0, true);
        let i = 0;
        while (i < rowCount) {
            if (this.matchesWhere(table, i, wheres)) {
                rowCount--;
                if (i < rowCount) {
                    copySlot(table, rowCount, i); // swap last into deleted slot
                }
                table.view.setUint32(0, rowCount, true);
                // don't advance i — the swapped-in row at position i needs checking
            } else {
                i++;
            }
        }
        this.invalidateTableIndexes(table.name);
    }

    private matchesWhere(
        table: TableStorage,
        slotIndex: number,
        wheres: BoundWhereClause[],
    ): boolean {
        const slotOffset = HEADER_BYTES + slotIndex * table.schema.rowSize;
        for (const where of wheres) {
            const col = this.getColumn(table, where.column);
            const value = decodeValue(table.view, slotOffset + col.offset, col);
            if (where.type === 'equals' && value !== where.value) {
                return false;
            }
            if (where.type === 'in' && !where.values.has(value)) {
                return false;
            }
        }
        return true;
    }

    private getColumn(
        table: TableStorage,
        columnName: string,
    ): ColumnDefinition {
        const col = table.schema.columns.find((c) => c.name === columnName);
        if (!col) {
            throw new Error(`Unknown column "${columnName}"`);
        }
        return col;
    }

    private matchesWhereObject(
        row: Record<string, unknown>,
        wheres: BoundWhereClause[],
    ): boolean {
        for (const where of wheres) {
            const value = row[where.column];
            if (where.type === 'equals' && value !== where.value) {
                return false;
            }
            if (where.type === 'in' && !where.values.has(value)) {
                return false;
            }
        }
        return true;
    }

    private bindWhere(
        wheres: WhereClause[],
        params: readonly unknown[],
    ): BoundWhereClause[] {
        let parameterIndex = 0;
        const bound = wheres.map((where): BoundWhereClause => {
            if (where.type === 'equals') {
                const value = params[parameterIndex];
                parameterIndex++;
                return { ...where, value };
            }
            const values = params.slice(
                parameterIndex,
                parameterIndex + where.parameterCount,
            );
            parameterIndex += where.parameterCount;
            return {
                type: 'in',
                column: where.column,
                values: new Set(values),
            };
        });
        if (parameterIndex !== params.length) {
            throw new Error(
                `WHERE expected ${parameterIndex} parameters, got ${params.length}`,
            );
        }
        return bound;
    }

    private invalidateTableIndexes(name: string): void {
        const prefix = `${name}.`;
        for (const key of this.joinIndexCache.keys()) {
            if (key.startsWith(prefix)) {
                this.joinIndexCache.delete(key);
            }
        }
    }

    private insertRow(
        table: TableStorage,
        values: Record<string, unknown>,
    ): void {
        const rowCount = table.view.getUint32(0, true);
        const capacity = table.view.getUint32(4, true);
        if (rowCount >= capacity) {
            growBuffer(table, this.growthFactor);
        }
        encodeRow(table, rowCount, values);
        table.view.setUint32(0, rowCount + 1, true);
        this.invalidateTableIndexes(table.name);
    }
}

function getErrorMessage(e: unknown): string {
    if (e instanceof Error) {
        return e.message;
    }
    return String(e);
}
