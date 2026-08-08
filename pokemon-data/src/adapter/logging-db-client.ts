import type { DbClient } from '@pokedb2/query-builder';
import { appendFile, mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';


export class LoggingDbClient implements DbClient {
    constructor(
        private readonly inner: DbClient,
        private readonly logger: SqlQueryLogger,
        private readonly context = 'builder-main',
    ) {}

    async execute(
        sql: string,
        parameters: readonly unknown[],
    ): Promise<unknown[]> {
        const result = await this.inner.execute(sql, parameters);
        await this.logger.append(sql, parameters, this.context);
        return result;
    }
}

export interface SqlQueryLogEntry {
    seq: number;
    sql: string;
    parameters: unknown[];
    context?: string;
}

export class SqlQueryLogger {
    private nextSeq = 1;

    constructor(private readonly logPath: string) {}

    async reset(): Promise<void> {
        await mkdir(dirname(this.logPath), { recursive: true });
        await writeFile(this.logPath, '');
        this.nextSeq = 1;
    }

    async append(
        sql: string,
        parameters: readonly unknown[],
        context?: string,
    ): Promise<void> {
        const entry: SqlQueryLogEntry = {
            seq: this.nextSeq++,
            sql,
            parameters: [...parameters],
            context,
        };
        await appendFile(this.logPath, `${JSON.stringify(entry)}\n`);
    }
}