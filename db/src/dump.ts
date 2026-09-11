import type { DB } from './db.ts';
import type { DumpOptions, DumpSection } from './types.ts';

export function describeDb(db: DB): string {
    const tables = db.describeTables();
    const lines = ['# Database Schema', ''];
    for (const table of tables) {
        lines.push(`## ${table.name}`);
        lines.push(`Rows: ${table.rowCount}`);
        lines.push('');
        for (const col of table.columns) {
            const typeStr =
                col.type === 'char' ? `${col.type}(${col.length})` : col.type;
            lines.push(`- ${col.name}: ${typeStr}`);
        }
        lines.push('');
    }
    return lines.join('\n');
}

export function dumpDb(db: DB, options?: DumpOptions): DumpSection[] {
    const allTables = db.describeTables();
    const tablesToDump = options?.tables
        ? allTables.filter((t) => options.tables?.includes(t.name))
        : allTables;

    return tablesToDump.map((table) => ({
        table: table.name,
        rowCount: table.rowCount,
        text: dumpTable(db, table.name, options),
    }));
}

export function dumpTable(
    db: DB,
    tableName: string,
    options?: DumpOptions,
): string {
    const format = options?.format ?? 'csv';
    const limit = options?.limit ?? Infinity;

    // Parser handles hyphens in identifiers without special quoting
    const rows = db.execute(`SELECT * FROM ${tableName}`, []);
    const limited = rows.slice(0, limit);

    if (format === 'jsonl') {
        return limited.map((row) => JSON.stringify(row)).join('\n');
    }

    if (format === 'csv') {
        if (limited.length === 0) {
            return '';
        }

        const header = Object.keys(limited[0]);
        const headerLine = csvLine(header);
        const bodyLines = limited.map((row) =>
            csvLine(header.map((key) => valueToString(row[key]))),
        );

        return [headerLine, ...bodyLines].join('\n');
    }

    throw new Error(`Unknown format: ${format}`);
}

function csvLine(values: string[]): string {
    return values.map((val) => csvEscape(val)).join(',');
}

function csvEscape(value: string): string {
    // RFC 4180: quote if contains comma, double-quote, CR, or LF
    if (
        !value.includes(',') &&
        !value.includes('"') &&
        !value.includes('\r') &&
        !value.includes('\n')
    ) {
        return value;
    }
    // Double internal quotes and wrap in quotes
    const escaped = value.replace(/"/g, '""');
    return `"${escaped}"`;
}

function valueToString(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }
    if (typeof value === 'boolean') {
        return value ? '1' : '0';
    }
    return String(value);
}
