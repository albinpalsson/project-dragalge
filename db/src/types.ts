export type ColumnType = 'int32' | 'boolean' | 'timestamp' | 'char';

export type ColumnDefinition =
    | { name: string; type: 'int32'; offset: number }
    | { name: string; type: 'boolean'; offset: number }
    | { name: string; type: 'timestamp'; offset: number }
    | { name: string; type: 'char'; length: number; offset: number };

export type ColumnInput =
    | { name: string; type: 'int32' }
    | { name: string; type: 'boolean' }
    | { name: string; type: 'timestamp' }
    | { name: string; type: 'char'; length: number };

export interface TableSchema {
    columns: ColumnDefinition[];
    rowSize: number; // 1 status byte + sum of column widths
}

// buffer layout: [rowCount: u32][rowCapacity: u32][slot 0][slot 1]...
export const HEADER_BYTES = 8;
export const INITIAL_CAPACITY = 16;

export interface TableStorage {
    name: string;
    schema: TableSchema;
    buffer: ArrayBuffer;
    view: DataView;
}

export const STATUS_ACTIVE = 1;

export interface StoragePlugin {
    read(): Promise<Uint8Array | null> | Uint8Array | null;
    write(blob: Uint8Array): Promise<void> | void;
}
