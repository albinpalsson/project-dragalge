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
}

interface QueueItem {
    url: string;
    resolve: (text: string) => void;
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
            item.resolve(await response.text());
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

function enqueue(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
        requestQueue.push({ url, resolve, reject });
        if (!executorRunning) {
            void runExecutor();
        }
    });
}

export const cachedFetcher: CachedFetcher = {
    async get(url: string): Promise<string> {
        const hash = createHash('sha256').update(url).digest('hex');
        const cachePath = join(CACHE_DIR, `${hash}.txt`);

        try {
            return await readFile(cachePath, 'utf-8');
        } catch {
            // cache miss — fall through to fetch
        }

        const text = await enqueue(url);

        await mkdir(CACHE_DIR, { recursive: true });
        await writeFile(cachePath, text, 'utf-8');

        return text;
    },
};
