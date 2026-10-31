import path from 'node:path';
import type {
    Chunk,
    ChunkGraph,
    DependencyEntry,
    DependencyModule,
    LazyRoot,
} from './graph/index.ts';
import type { RuntimeOptions } from './main.ts';

export interface ModuleIds {
    /** Module path -> id in the shared module table. */
    modules: Map<string, string>;
    /** Lazy root path -> id of the stub that `import()` of it resolves to. */
    stubs: Map<string, string>;
}

/** Ids are global so chunk contents never depend on other chunks. */
export function assignModuleIds(
    entries: DependencyEntry[],
    roots: LazyRoot[],
): ModuleIds {
    const nameGen = createNameGenerator();
    return {
        modules: new Map(entries.map((entry) => [entry.path, nameGen()])),
        stubs: new Map(roots.map((root) => [root.path, nameGen()])),
    };
}

/**
 * A chunk only registers module factories into the main table; nothing runs
 * until a stub requires one of its modules. `m` is the main script's
 * top-level binding, shared by all classic scripts on the page.
 */
export function generateChunkCode(chunk: Chunk, ids: ModuleIds): string {
    return `Object.assign(m,{\n${moduleTableEntries(chunk.entries, ids)}\n});`;
}

export function generateMainCode(
    graph: ChunkGraph,
    ids: ModuleIds,
    chunkFileNames: Map<Chunk, string>,
    options: RuntimeOptions,
): string {
    const normalizedEntryPath = path.resolve(options.entryPath);
    const stubEntries = graph.roots.map((root) => {
        const files = root.chunks.map((chunk) => chunkFileNames.get(chunk));
        return `${JSON.stringify(ids.stubs.get(root.path))}: (module) => {module.exports=z(${JSON.stringify(ids.modules.get(root.path))},${JSON.stringify(files)});}`;
    });
    const tableEntries = [moduleTableEntries(graph.main, ids), ...stubEntries]
        .filter((part) => part.length > 0)
        .join(',\n');

    return [
        'const m={',
        tableEntries,
        '};',
        `const c={};const r=id=>{if(c[id]) return c[id].exports;const f=m[id];if(!f){throw new Error(\`Module not found: \${id}\`)};const module={exports:{}};c[id]=module;f(module,module.exports,r);return module.exports;};`,
        ...(graph.roots.length > 0 ? [lazyLoaderCode] : []),
        `r(${JSON.stringify(ids.modules.get(normalizedEntryPath))});`,
    ].join('\n');
}

// `l` loads a chunk script once. `z` builds the stub exports for a lazy root: a
// thenable flagged `__esModule`, so TypeScript's `__importStar` passes it
// through and the promise returned by `import()` adopts it, resolving with the
// real exports once every chunk is loaded. Plain CommonJS exports get a
// `default` like Node's import(); named exports are not spread.
const lazyLoaderCode = [
    'const q={};',
    'const l=f=>q[f]||(q[f]=new Promise((ok,fail)=>{const s=document.createElement("script");s.src=f;s.onload=ok;s.onerror=()=>{delete q[f];fail(new Error("Failed to load "+f))};document.head.appendChild(s)}));',
    'const z=(id,files)=>({__esModule:true,then:(ok,fail)=>Promise.all(files.map(l)).then(()=>{const e=r(id);return e&&e.__esModule?e:{default:e}}).then(ok,fail)});',
].join('\n');

function moduleTableEntries(
    entries: DependencyEntry[],
    ids: ModuleIds,
): string {
    return entries
        .map((entry) => {
            const rewrittenCode = rewriteRequires(entry, ids);
            const id = ids.modules.get(entry.path) ?? entry.path;
            return `${JSON.stringify(id)}: (module, exports, require) => {\n${rewrittenCode}\n}`;
        })
        .join(',\n');
}

function rewriteRequires(module: DependencyEntry, ids: ModuleIds): string {
    if (!('requires' in module)) {
        return module.code;
    }

    const localRequireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
    const dependencyMap = buildDependencyMap(module);

    return module.code.replace(
        localRequireRegex,
        (fullMatch, specifier: string) => {
            const dependency = dependencyMap[specifier];
            if (dependency) {
                const moduleId = dependency.dynamic
                    ? (ids.stubs.get(dependency.resolvedPath) ??
                      ids.modules.get(dependency.resolvedPath))
                    : ids.modules.get(dependency.resolvedPath);
                if (moduleId) {
                    return `require(${JSON.stringify(moduleId)})`;
                }
            }

            return fullMatch;
        },
    );
}

function buildDependencyMap(
    module: DependencyModule,
): Record<string, { resolvedPath: string; dynamic: boolean }> {
    const out: Record<string, { resolvedPath: string; dynamic: boolean }> = {};
    for (const dep of module.requires) {
        out[dep.specifier] = dep;
    }
    return out;
}

function createNameGenerator(): () => string {
    let counter = 0;
    return () => {
        counter += 1;
        return counter.toString(36);
    };
}
