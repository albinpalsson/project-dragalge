import { DB } from '../db.ts';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

class FileStoragePlugin {
    constructor(private readonly filePath: string) {}

    async read(): Promise<Uint8Array | null> {
        try {
            const data = await readFile(this.filePath);
            return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        } catch (error) {
            const code = (error as NodeJS.ErrnoException).code;
            if (code === 'ENOENT') {
                return null;
            }
            throw error;
        }
    }

    async write(blob: Uint8Array): Promise<void> {
        await mkdir(dirname(this.filePath), { recursive: true });
        await writeFile(this.filePath, blob);
    }
}

interface ParsedArgs {
    dbPath: string;
    growthFactor?: number;
    positional: string[];
}

function parseArgs(argv: string[]): ParsedArgs {
    const positional: string[] = [];
    let dbPath: string | undefined;
    let growthFactor: number | undefined;

    for (let i = 0; i < argv.length; i++) {
        const current = argv[i];
        if (current === '--db') {
            dbPath = argv[i + 1];
            i++;
            continue;
        }
        if (current === '--growth-factor') {
            const raw = argv[i + 1];
            if (raw === undefined) {
                throw new Error('Missing value for --growth-factor');
            }
            const parsed = Number(raw);
            if (!Number.isFinite(parsed) || parsed <= 0) {
                throw new Error('--growth-factor must be a finite number greater than 0');
            }
            growthFactor = parsed;
            i++;
            continue;
        }
        positional.push(current);
    }

    if (!dbPath) {
        throw new Error('Missing required --db <path> argument');
    }

    return { dbPath: resolve(dbPath), growthFactor, positional };
}

function parseParameters(paramsJson: string | undefined): unknown[] {
    if (!paramsJson) {
        return [];
    }
    const parsed = JSON.parse(paramsJson) as unknown;
    if (!Array.isArray(parsed)) {
        throw new Error('paramsJson must be a JSON array');
    }
    return parsed;
}

async function main(): Promise<void> {
    const { dbPath, growthFactor, positional } = parseArgs(process.argv.slice(2));
    const [sql, paramsJson] = positional;
    if (!sql) {
        throw new Error('Expected SQL argument. Usage: <sql> [paramsJson] --db <path> [--growth-factor <number>]');
    }

    const plugin = new FileStoragePlugin(dbPath);
    const db = growthFactor === undefined
        ? new DB(plugin)
        : new DB(plugin, { growthFactor });
    await db.load();

    const result = db.execute(sql, parseParameters(paramsJson));
    await db.save();
    process.stdout.write(`${JSON.stringify(result)}\n`);
}

void main().catch((error) => {
    process.stderr.write(`${(error as Error).message}\n`);
    process.exitCode = 1;
});
