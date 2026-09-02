import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DB } from '@pokedb2/db';

export class DbClient extends DB {
    private readonly logger: SqlQueryLogger;

    constructor(dbPath: string, options?: { growthFactor?: number }) {
        const growthFactor = options?.growthFactor;
        const storage = new FileStoragePlugin(dbPath);
        super(
            storage,
            growthFactor === undefined ? undefined : { growthFactor },
        );
        this.logger = new SqlQueryLogger(
            resolve(dirname(dbPath), 'query-log.jsonl'),
        );
    }

    execute(sql: string, parameters: readonly unknown[]) {
        const result = super.execute(sql, parameters);
        this.logger.append(sql, parameters);
        return result;
    }

    override async save(): Promise<void> {
        await super.save();
        await this.logger.flush();
    }
}

class FileStoragePlugin {
    private readonly modulePath: string;
    constructor(modulePath: string) {
        this.modulePath = modulePath;
    }

    read() {
        return null;
    }
    async write(blob: Uint8Array) {
        const base64 = Buffer.from(blob).toString('base64');
        const moduleSource = `const data = ${JSON.stringify(base64)};
module.exports = data;
module.exports.default = data;`;
        await writeFile(this.modulePath, moduleSource);
    }
}

interface QueryLogEntry {
    seq: number;
    sql: string;
    parameters: unknown[];
    context?: string;
}

export class SqlQueryLogger {
    private nextSeq = 1;
    private entries: QueryLogEntry[] = [];
    private readonly logPath: string;

    constructor(logPath: string) {
        this.logPath = logPath;
    }

    reset(): void {
        this.entries = [];
        this.nextSeq = 1;
    }

    append(
        sql: string,
        parameters: readonly unknown[],
        context?: string,
    ): void {
        this.entries.push({
            seq: this.nextSeq++,
            sql,
            parameters: [...parameters],
            context,
        });
    }

    // Buffered and written once so log order follows execute order, not write completion order.
    async flush(): Promise<void> {
        const lines = this.entries
            .slice()
            .sort((a, b) => a.seq - b.seq)
            .map((entry) => JSON.stringify(entry));
        await mkdir(dirname(this.logPath), { recursive: true });
        await writeFile(
            this.logPath,
            lines.length === 0 ? '' : `${lines.join('\n')}\n`,
            'utf-8',
        );
    }
}
