import type { DbClient } from '@pokedb2/query-builder';
import { spawn } from 'node:child_process';

export class CliDbClient implements DbClient {
    constructor(
        private readonly dbPath: string,
        private readonly growthFactor: number | undefined,
        private readonly cliCommand = 'pokedb2-db-sql',
    ) {}

    async execute(
        sql: string,
        parameters: readonly unknown[],
    ): Promise<unknown[]> {
        const args = [
            sql,
            JSON.stringify(parameters),
            '--db',
            this.dbPath,
        ];
        if (this.growthFactor !== undefined) {
            args.push('--growth-factor', String(this.growthFactor));
        }

        const stdout = await runCli(this.cliCommand, args);
        const trimmed = stdout.trim();
        if (!trimmed) {
            return [];
        }
        return JSON.parse(trimmed) as unknown[];
    }
}

function runCli(command: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            shell: true,
            windowsHide: true,
        });

        let stdout = '';
        let stderr = '';
        const maxBytes = 10 * 1024 * 1024;

        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');

        child.stdout.on('data', (chunk: string) => {
            stdout += chunk;
            if (Buffer.byteLength(stdout, 'utf8') > maxBytes) {
                child.kill();
                reject(new Error('CLI stdout exceeded max buffer size'));
            }
        });

        child.stderr.on('data', (chunk: string) => {
            stderr += chunk;
            if (Buffer.byteLength(stderr, 'utf8') > maxBytes) {
                child.kill();
                reject(new Error('CLI stderr exceeded max buffer size'));
            }
        });

        child.on('error', (error) => {
            reject(error);
        });

        child.on('close', (code) => {
            if (code !== 0) {
                const detail = stderr.trim() || `CLI exited with code ${code ?? 'null'}`;
                reject(new Error(detail));
                return;
            }
            resolve(stdout);
        });
    });
}
