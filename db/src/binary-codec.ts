import type { ColumnDefinition, TableStorage } from './types.ts';
import { HEADER_BYTES, STATUS_ACTIVE } from './types.ts';

const enc = new TextEncoder();
const dec = new TextDecoder();

export function columnByteWidth(col: ColumnDefinition): number {
    switch (col.type) {
        case 'int32':
            return 4;
        case 'uint8':
            return 1;
        case 'boolean':
            return 1;
        case 'timestamp':
            return 8;
        case 'char':
            return col.length;
    }
}

export function encodeValue(
    view: DataView,
    byteOffset: number,
    col: ColumnDefinition,
    value: unknown,
): void {
    switch (col.type) {
        case 'int32':
            view.setInt32(byteOffset, value as number, true);
            break;
        case 'uint8': {
            const n = value as number;
            if (!Number.isInteger(n) || n < 0 || n > 255) {
                throw new RangeError(`uint8 value out of range [0, 255]: ${col.name} -> ${n}`);
            }
            view.setUint8(byteOffset, n);
            break;
        }
        case 'boolean':
            view.setUint8(byteOffset, (value as boolean) ? 1 : 0);
            break;
        case 'timestamp':
            view.setFloat64(byteOffset, value as number, true);
            break;
        case 'char': {
            const n = col.length;
            const bytes = enc.encode(value as string);
            if (bytes.length > n) {
                throw new Error(
                    `Value too long for char(${n}): got ${bytes.length} bytes`,
                );
            }
            const dest = new Uint8Array(
                view.buffer,
                view.byteOffset + byteOffset,
                n,
            );
            dest.fill(0);
            dest.set(bytes);
            break;
        }
    }
}

export function decodeValue(
    view: DataView,
    byteOffset: number,
    col: ColumnDefinition,
): unknown {
    switch (col.type) {
        case 'int32':
            return view.getInt32(byteOffset, true);
        case 'uint8':
            return view.getUint8(byteOffset);
        case 'boolean':
            return view.getUint8(byteOffset) !== 0;
        case 'timestamp':
            return view.getFloat64(byteOffset, true);
        case 'char': {
            const n = col.length;
            const bytes = new Uint8Array(
                view.buffer,
                view.byteOffset + byteOffset,
                n,
            );
            let end = n;
            while (end > 0 && bytes[end - 1] === 0) {
                end--;
            }
            return dec.decode(bytes.subarray(0, end));
        }
    }
}

export function encodeRow(
    table: TableStorage,
    slotIndex: number,
    values: Record<string, unknown>,
): void {
    const slotOffset = HEADER_BYTES + slotIndex * table.schema.rowSize;
    table.view.setUint8(slotOffset, STATUS_ACTIVE);
    for (const col of table.schema.columns) {
        encodeValue(table.view, slotOffset + col.offset, col, values[col.name]);
    }
}

export function decodeRow(
    table: TableStorage,
    slotIndex: number,
): Record<string, unknown> {
    const slotOffset = HEADER_BYTES + slotIndex * table.schema.rowSize;
    const row: Record<string, unknown> = {};
    for (const col of table.schema.columns) {
        row[col.name] = decodeValue(table.view, slotOffset + col.offset, col);
    }
    return row;
}

export function copySlot(
    table: TableStorage,
    srcIndex: number,
    dstIndex: number,
): void {
    const src = HEADER_BYTES + srcIndex * table.schema.rowSize;
    const dst = HEADER_BYTES + dstIndex * table.schema.rowSize;
    new Uint8Array(table.buffer).copyWithin(
        dst,
        src,
        src + table.schema.rowSize,
    );
}
