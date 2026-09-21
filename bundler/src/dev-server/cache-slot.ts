import {
    existsSync,
    mkdirSync,
    rmSync,
    statSync,
    utimesSync,
} from 'node:fs';
import path from 'node:path';

// Bounds the number of dev-server cache directories that can accumulate on disk
// regardless of how many times `--port 0` is used.
const MAX_CACHE_SLOTS = 10;

// Double-buffered build output dirs, shared with DevServer's build/serve paths.
export const OUTPUT_BUFFER_DIR_NAMES = ['output-0', 'output-1'] as const;

/**
 * Picks a cache directory for a dev-server instance from a fixed pool of slots,
 * reusing the least-recently-used one once the pool is full. Not exclusive
 * across processes: two servers starting at the same instant could pick the
 * same slot, which is an accepted small risk in exchange for avoiding complexity.
 */
export function pickCacheSlot(cacheRoot: string): string {
    const slotsRoot = path.resolve(cacheRoot, 'dev-slots');

    let oldestSlotDir: string | undefined;
    let oldestMtimeMs = Number.POSITIVE_INFINITY;

    for (let index = 0; index < MAX_CACHE_SLOTS; index += 1) {
        const slotDir = path.join(slotsRoot, `slot-${index}`);
        if (!existsSync(slotDir)) {
            return claimSlot(slotDir);
        }

        const { mtimeMs } = statSync(slotDir);
        if (mtimeMs < oldestMtimeMs) {
            oldestMtimeMs = mtimeMs;
            oldestSlotDir = slotDir;
        }
    }

    return claimSlot(oldestSlotDir as string);
}

function claimSlot(slotDir: string): string {
    mkdirSync(slotDir, { recursive: true });

    const now = new Date();
    utimesSync(slotDir, now, now);

    for (const bufferDirName of OUTPUT_BUFFER_DIR_NAMES) {
        rmSync(path.join(slotDir, bufferDirName), {
            recursive: true,
            force: true,
        });
    }

    return slotDir;
}
