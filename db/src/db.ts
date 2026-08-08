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
} from './types.ts';
import { HEADER_BYTES, INITIAL_CAPACITY } from './types.ts';

function makeSchema(columns: ColumnInput[]): TableSchema {
    let offset = 1; // byte 0 is the status byte
    const resolved: ColumnDefinition[] = columns.map((col) => {
        let c: ColumnDefinition;
        switch (col.type) {
            case 'char':
                c = { ...col, offset };
                break;
            case 'int32':
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

function growBuffer(table: TableStorage): void {
    const oldCapacity = table.view.getUint32(4, true);
    const newCapacity = oldCapacity * 2;
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

    constructor(storage?: StoragePlugin) {
        this.storage = storage;
    }

    private createTableInternal(name: string, columns: ColumnInput[]): void {
        if (this.tables.has(name)) {
            throw new Error(`Table "${name}" already exists`);
        }
        const resolved = makeSchema(columns);
        const { buffer, view } = allocateBuffer(
            resolved.rowSize,
            INITIAL_CAPACITY,
        );
        this.tables.set(name, { name, schema: resolved, buffer, view });
    }

    execute(
        sql: string,
        parameters: readonly unknown[],
    ): Record<string, unknown>[] {
        const stmt = parse(sql);

        if (stmt.type === 'select') {
            const table = this.getTable(stmt.table);
            if (stmt.join) {
                return this.executeJoinSelect(
                    table,
                    stmt.join,
                    stmt.wheres,
                    parameters,
                );
            }
            return this.executeSelect(table, stmt.wheres, parameters);
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
            this.executeUpdate(table, stmt.setCols, parameters, stmt.wheres);
            this.scheduleWrite();
            return [];
        }

        if (stmt.type === 'delete') {
            const table = this.getTable(stmt.table);
            this.executeDelete(table, stmt.wheres, parameters);
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
        wheres: WhereClause[],
        params: readonly unknown[],
    ): Record<string, unknown>[] {
        const rowCount = table.view.getUint32(0, true);
        const result: Record<string, unknown>[] = [];
        for (let i = 0; i < rowCount; i++) {
            if (this.matchesWhere(table, i, wheres, params)) {
                result.push(decodeRow(table, i));
            }
        }
        return result;
    }

    private executeJoinSelect(
        leftTable: TableStorage,
        join: JoinClause,
        wheres: WhereClause[],
        params: readonly unknown[],
    ): Record<string, unknown>[] {
        const rightTable = this.getTable(join.table);
        const leftCount = leftTable.view.getUint32(0, true);
        const rightCount = rightTable.view.getUint32(0, true);
        const leftJoinCol = this.getColumn(leftTable, join.leftCol);
        const rightJoinCol = this.getColumn(rightTable, join.rightCol);
        const rightIndexByKey = new Map<unknown, number[]>();
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
                if (this.matchesWhereObject(merged, wheres, params)) {
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
    ): void {
        const whereParams = params.slice(setCols.length);
        const setColumns = setCols.map((colName) =>
            this.getColumn(table, colName),
        );
        const rowCount = table.view.getUint32(0, true);
        for (let i = 0; i < rowCount; i++) {
            if (this.matchesWhere(table, i, wheres, whereParams)) {
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
    }

    private executeDelete(
        table: TableStorage,
        wheres: WhereClause[],
        params: readonly unknown[],
    ): void {
        let rowCount = table.view.getUint32(0, true);
        let i = 0;
        while (i < rowCount) {
            if (this.matchesWhere(table, i, wheres, params)) {
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
    }

    private matchesWhere(
        table: TableStorage,
        slotIndex: number,
        wheres: WhereClause[],
        params: readonly unknown[],
    ): boolean {
        const slotOffset = HEADER_BYTES + slotIndex * table.schema.rowSize;
        for (let i = 0; i < wheres.length; i++) {
            const col = this.getColumn(table, wheres[i].column);
            if (
                decodeValue(table.view, slotOffset + col.offset, col) !==
                params[i]
            ) {
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
        wheres: WhereClause[],
        params: readonly unknown[],
    ): boolean {
        for (let i = 0; i < wheres.length; i++) {
            if (row[wheres[i].column] !== params[i]) {
                return false;
            }
        }
        return true;
    }

    private insertRow(
        table: TableStorage,
        values: Record<string, unknown>,
    ): void {
        const rowCount = table.view.getUint32(0, true);
        const capacity = table.view.getUint32(4, true);
        if (rowCount >= capacity) {
            growBuffer(table);
        }
        encodeRow(table, rowCount, values);
        table.view.setUint32(0, rowCount + 1, true);
    }
}
