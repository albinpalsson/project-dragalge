import type { DbClient } from '@pokedb2/query-builder';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class CliDbClient implements DbClient {
    constructor(
        private readonly cliPath: string,
        private readonly dbPath: string,
        private readonly growthFactor: number | undefined,
        private readonly nodePath = process.execPath,
    ) {}

    async execute(
        sql: string,
        parameters: readonly unknown[],
    ): Promise<unknown[]> {
        const args = [
            this.cliPath,
            sql,
            JSON.stringify(parameters),
            '--db',
            this.dbPath,
        ];
        if (this.growthFactor !== undefined) {
            args.push('--growth-factor', String(this.growthFactor));
        }
        const { stdout } = await execFileAsync(this.nodePath, args, {
            maxBuffer: 10 * 1024 * 1024,
        });
        const trimmed = stdout.trim();
        if (!trimmed) {
            return [];
        }
        return JSON.parse(trimmed) as unknown[];
    }
}
