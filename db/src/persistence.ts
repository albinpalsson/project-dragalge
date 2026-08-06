import { columnByteWidth } from "./binary-codec.ts";
import type {
	ColumnDefinition,
	ColumnInput,
	ColumnType,
	TableStorage,
} from "./types.ts";

const MAGIC = 0xdb420001;
const U8 = 1;
const U16 = 2;
const U32 = 4;
const BLOB_HEADER = U32 * 2; // magic + tableCount

function typeToId(t: ColumnType): number {
	switch (t) {
		case "int32":
			return 0;
		case "boolean":
			return 1;
		case "timestamp":
			return 2;
		case "char":
			return 3;
	}
}

function idToType(id: number): ColumnType {
	if (id === 0) {
		return "int32";
	}
	if (id === 1) {
		return "boolean";
	}
	if (id === 2) {
		return "timestamp";
	}
	if (id === 3) {
		return "char";
	}
	throw new Error(`Unknown column type id: ${id}`);
}

export function encodeBlob(tables: Map<string, TableStorage>): Uint8Array {
	const enc = new TextEncoder();
	let size = BLOB_HEADER;
	for (const [name, table] of tables) {
		size += U8 + enc.encode(name).length + U8;
		for (const col of table.schema.columns) {
			size += U8 + enc.encode(col.name).length + U8 + U16 + U16;
		}
		size += U32 + U32 + table.buffer.byteLength;
	}
	const out = new Uint8Array(size);
	const view = new DataView(out.buffer);
	let pos = 0;
	view.setUint32(pos, MAGIC, true);
	pos += U32;
	view.setUint32(pos, tables.size, true);
	pos += U32;
	for (const [name, table] of tables) {
		const nb = enc.encode(name);
		out[pos++] = nb.length;
		out.set(nb, pos);
		pos += nb.length;
		out[pos++] = table.schema.columns.length;
		for (const col of table.schema.columns) {
			const cb = enc.encode(col.name);
			out[pos++] = cb.length;
			out.set(cb, pos);
			pos += cb.length;
			out[pos++] = typeToId(col.type);
			view.setUint16(pos, col.offset, true);
			pos += U16;
			view.setUint16(pos, columnByteWidth(col), true);
			pos += U16;
		}
		view.setUint32(pos, table.schema.rowSize, true);
		pos += U32;
		view.setUint32(pos, table.buffer.byteLength, true);
		pos += U32;
		out.set(new Uint8Array(table.buffer), pos);
		pos += table.buffer.byteLength;
	}
	return out;
}

export function decodeBlob(blob: Uint8Array): Map<string, TableStorage> {
	const dec = new TextDecoder();
	const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
	let pos = 0;
	if (view.getUint32(pos, true) !== MAGIC) {
		throw new Error("Invalid blob: bad magic");
	}
	pos += U32;
	const tableCount = view.getUint32(pos, true);
	pos += U32;
	const tables = new Map<string, TableStorage>();
	for (let t = 0; t < tableCount; t++) {
		const nameLen = blob[pos++];
		const name = dec.decode(blob.subarray(pos, pos + nameLen));
		pos += nameLen;
		const colCount = blob[pos++];
		const columns: ColumnDefinition[] = [];
		for (let c = 0; c < colCount; c++) {
			const cnLen = blob[pos++];
			const colName = dec.decode(blob.subarray(pos, pos + cnLen));
			pos += cnLen;
			const type = idToType(blob[pos++]);
			const offset = view.getUint16(pos, true);
			pos += U16;
			const byteWidth = view.getUint16(pos, true);
			pos += U16;
			let base: ColumnInput;
			switch (type) {
				case "char":
					base = { name: colName, type: "char", length: byteWidth };
					break;
				case "int32":
				case "boolean":
				case "timestamp":
					base = { name: colName, type };
					break;
			}
			columns.push({ ...base, offset });
		}
		const rowSize = view.getUint32(pos, true);
		pos += U32;
		const bufLen = view.getUint32(pos, true);
		pos += U32;
		// slice raw buffer bytes — zero row parsing on load
		const buffer = blob.buffer.slice(
			blob.byteOffset + pos,
			blob.byteOffset + pos + bufLen,
		) as ArrayBuffer;
		pos += bufLen;
		const dv = new DataView(buffer);
		tables.set(name, {
			name,
			schema: { columns, rowSize },
			buffer,
			view: dv,
		});
	}
	return tables;
}
