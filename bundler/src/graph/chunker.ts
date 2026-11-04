import type { Chunk, ChunkGraph, DependencyEntry, LazyRoot } from './types.ts';

/**
 * Splits the module graph along dynamic `import()` edges.
 *
 * - Everything statically reachable from the entry is the main bundle.
 * - Every other `import()` target is a lazy root. A root whose own static
 *   closure (minus main) is smaller than `minChunkBytes` is not worth a
 *   request and is demoted: its modules join main.
 * - Modules outside main are grouped by the set of roots that reach them, so a
 *   module shared by two lazy roots lives in exactly one chunk and both roots
 *   load it. Modules are never duplicated, which keeps singletons intact.
 */
export function splitIntoChunks(
    entries: DependencyEntry[],
    entryPath: string,
    minChunkBytes: number,
): ChunkGraph {
    const byPath = new Map(entries.map((entry) => [entry.path, entry]));
    const dynamicTargets = new Set<string>();
    const prefetchTargets = new Set<string>();
    for (const entry of entries) {
        if ('requires' in entry) {
            for (const dependency of entry.requires) {
                if (dependency.dynamic) {
                    dynamicTargets.add(dependency.resolvedPath);
                }
                if (dependency.prefetch) {
                    prefetchTargets.add(dependency.resolvedPath);
                }
            }
        }
    }

    function staticClosure(starts: Iterable<string>): Set<string> {
        const seen = new Set<string>();
        const pending = [...starts];
        for (let path = pending.pop(); path !== undefined; path = pending.pop()) {
            if (seen.has(path)) {
                continue;
            }
            seen.add(path);
            const entry = byPath.get(path);
            if (entry && 'requires' in entry) {
                for (const dependency of entry.requires) {
                    if (!dependency.dynamic) {
                        pending.push(dependency.resolvedPath);
                    }
                }
            }
        }
        return seen;
    }

    function sizeOf(paths: Iterable<string>): number {
        let size = 0;
        for (const path of paths) {
            const entry = byPath.get(path);
            if (entry?.type === 'js') {
                size += entry.code.length;
            }
        }
        return size;
    }

    const demoted = new Set<string>();
    while (true) {
        const main = staticClosure([entryPath, ...demoted]);
        const roots = [...dynamicTargets].filter((path) => !main.has(path));
        const reach = new Map(
            roots.map((root) => [
                root,
                [...staticClosure([root])].filter((path) => !main.has(path)),
            ]),
        );
        const tiny = roots.filter(
            (root) => sizeOf(reach.get(root) ?? []) < minChunkBytes,
        );
        if (tiny.length > 0) {
            for (const root of tiny) {
                demoted.add(root);
            }
            continue;
        }

        const rootsOf = new Map<string, string[]>();
        for (const [root, paths] of reach) {
            for (const path of paths) {
                rootsOf.set(path, [...(rootsOf.get(path) ?? []), root]);
            }
        }

        const mainEntries: DependencyEntry[] = [];
        const chunksByKey = new Map<string, Chunk>();
        for (const entry of entries) {
            const owners = rootsOf.get(entry.path);
            // Entries nothing requires (e.g. CSS added by a post-module
            // transform) are not part of any chunk.
            if (main.has(entry.path) || !owners) {
                mainEntries.push(entry);
                continue;
            }
            const key = owners.join('\0');
            let chunk = chunksByKey.get(key);
            if (!chunk) {
                chunk = { entries: [], roots: owners };
                chunksByKey.set(key, chunk);
            }
            chunk.entries.push(entry);
        }

        const chunks = [...chunksByKey.values()];
        const lazyRoots: LazyRoot[] = roots.map((root) => ({
            path: root,
            chunks: chunks.filter((chunk) => chunk.roots.includes(root)),
            prefetch: prefetchTargets.has(root),
        }));
        return { main: mainEntries, chunks, roots: lazyRoots };
    }
}
