import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { DB, type StoragePlugin, describeDb, dumpDb } from '@pokedb2/db';

// Read-only StoragePlugin that loads from a base64 string
class Base64ReadOnlyStoragePlugin implements StoragePlugin {
    private readonly base64: string;

    constructor(base64: string) {
        this.base64 = base64;
    }

    read(): Uint8Array {
        return Buffer.from(this.base64, 'base64');
    }

    write(): void {
        throw new Error('This plugin is read-only');
    }
}

async function main() {
    const args = process.argv.slice(2);
    const artifactPath = resolve(
        import.meta.dirname,
        '../artifacts/paldea-db.js',
    );

    // Read the artifact file as text and extract the base64 string
    const moduleSource = readFileSync(artifactPath, 'utf-8');
    const match = moduleSource.match(/const data = "([^"]+)"/);
    if (!match?.[1]) {
        throw new Error(`Could not extract base64 data from ${artifactPath}`);
    }
    const base64 = match[1];

    // Create DB instance with the read-only plugin
    const db = new DB(new Base64ReadOnlyStoragePlugin(base64));
    const loaded = await db.load();
    if (!loaded) {
        throw new Error('Failed to load database');
    }

    // Parse arguments
    const schemaOnly = args.includes('--schema-only');
    const formatIdx = args.indexOf('--format');
    const format =
        formatIdx >= 0 ? (args[formatIdx + 1] as 'csv' | 'jsonl') : 'csv';
    const limitIdx = args.indexOf('--limit');
    const limit =
        limitIdx >= 0 ? parseInt(args[limitIdx + 1] ?? '', 10) : undefined;

    // Collect --table args
    const tables: string[] = [];
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--table' && i + 1 < args.length) {
            tables.push(args[i + 1] as string);
        }
    }

    // Output schema if --schema-only
    if (schemaOnly) {
        process.stdout.write(describeDb(db));
        return;
    }

    // Dump tables
    const sections = dumpDb(db, {
        format,
        tables: tables.length > 0 ? tables : undefined,
        limit,
    });

    for (const section of sections) {
        process.stdout.write(
            `## ${section.table} (${section.rowCount} rows)\n`,
        );
        if (section.text) {
            process.stdout.write(section.text);
        }
        process.stdout.write('\n\n');
    }
}

main().catch((err) => {
    process.stderr.write(
        `Error: ${err instanceof Error ? err.message : err}\n`,
    );
    process.exit(1);
});
