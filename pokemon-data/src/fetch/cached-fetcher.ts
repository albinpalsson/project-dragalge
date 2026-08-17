import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const POLITE_DELAY_MS = 300;

// resolved relative to this module: pokemon-data/src/fetch/ -> ../../.cache
const CACHE_DIR = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '..', '..', '.cache',
);

export interface CachedFetcher {
    get(url: string): Promise<string>;
    getBinary(url: string): Promise<Uint8Array>;
}

interface QueueItem {
    url: string;
    resolve: (bytes: Uint8Array) => void;
    reject: (err: unknown) => void;
}

const requestQueue: QueueItem[] = [];
let executorRunning = false;
let executorCancelled = false;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 3;

function formatError(err: unknown, indent = ''): string {
    if (!(err instanceof Error)) return `${indent}${String(err)}`;
    const cause = err.cause != null ? `\n${formatError(err.cause, indent + '  ')}` : '';
    return `${indent}${err.message}${cause}`;
}

async function runExecutor(): Promise<void> {
    executorRunning = true;
    while (requestQueue.length > 0 && !executorCancelled) {
        const item = requestQueue.shift()!;
        try {
            let response: Response;
            try {
                response = await fetch(item.url);
            } catch (cause) {
                throw new Error(`Network error fetching ${item.url}`, { cause });
            }
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} fetching ${item.url}`);
            }
            item.resolve(new Uint8Array(await response.arrayBuffer()));
            consecutiveFailures = 0;
        } catch (err) {
            consecutiveFailures++;
            process.stderr.write(`${formatError(err)}\n`);
            item.reject(err);
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
                executorCancelled = true;
            }
        }
        await new Promise<void>((r) => setTimeout(r, POLITE_DELAY_MS));
    }
    // Drain remaining items immediately on cancellation
    for (const item of requestQueue.splice(0)) {
        item.reject(new Error('Fetch queue cancelled'));
    }
    executorRunning = false;
}

function enqueue(url: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
        requestQueue.push({ url, resolve, reject });
        if (!executorRunning) {
            void runExecutor();
        }
    });
}

async function getCachedBytes(url: string, extension: 'txt' | 'bin'): Promise<Uint8Array> {
    const hash = createHash('sha256').update(url).digest('hex');
    const cachePath = join(CACHE_DIR, `${hash}.${extension}`);

    try {
        return await readFile(cachePath);
    } catch {
        // cache miss — fall through to fetch
    }

    const bytes = await enqueue(url);

    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(cachePath, bytes);

    return bytes;
}

export const cachedFetcher: CachedFetcher = {
    async get(url: string): Promise<string> {
        const bytes = await getCachedBytes(url, 'txt');
        return new TextDecoder().decode(bytes);
    },

    async getBinary(url: string): Promise<Uint8Array> {
        return getCachedBytes(url, 'bin');
    },
};
