import { appendFile, mkdir, writeFile } from 'node:fs/promises';
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
export default data;`;
        await writeFile(this.modulePath, moduleSource);
    }
}

export class SqlQueryLogger {
    private nextSeq = 1;
    private readonly logPath: string;

    constructor(logPath: string) {
        this.logPath = logPath;
        this.reset();
    }

    async reset(): Promise<void> {
        await mkdir(dirname(this.logPath), { recursive: true });
        await writeFile(this.logPath, '');
        this.nextSeq = 1;
    }

    append(
        sql: string,
        parameters: readonly unknown[],
        context?: string,
    ): void {
        const entry = {
            seq: this.nextSeq++,
            sql,
            parameters: [...parameters],
            context,
        };
        void appendFile(this.logPath, `${JSON.stringify(entry)}\n`);
    }
}
