# SPA Bundler Specification (Constrained CJS Bundler with React Support)

## Research & Context

### Why Custom Bundler?

We need a lightweight bundler that:
- Bundles app code into a single browser-ready JavaScript file.
- Works with output from TypeScript pre-compilation.
- Supports React without implementing a full npm-compatible bundler.
- Keeps implementation understandable and correctness-first.

### Design Approach

- Pre-step: run TypeScript compile first.
- Bundle target: CommonJS module graph with function-scoped wrappers.
- Runtime: tiny require cache loader inside final bundle.
- npm support: intentionally narrow and React-focused.
- Performance: good enough for local development, not production-optimized.

### Key Decision

V1 will prioritize low complexity and predictable behavior:
1. Use function-scoped modules, not scope hoisting.
2. Parse dependency edges naively (regex-based is acceptable for controlled input).
3. Support a constrained node_modules resolver focused on React packages.
4. Fail fast with explicit errors when unsupported patterns are used.

---

## Requirements (In-Scope)

### Inputs and Transpilation

- Input to bundler is JavaScript emitted by TypeScript.
- Build pipeline runs TypeScript before bundling.
- Bundler reads transpiled files from the configured build input path.

### Module Parsing

- Detect CommonJS requires: `require('...')`.
- Ignore dynamic requires unless literal string specifier is present.

### Module Resolution

- Relative paths: `./` and `../`.
- App files: resolve `.js` first.
- CSS imports: collect into one output CSS file when encountered.
- Constrained node_modules support for React family only.

Supported package ids in V1:
- `react`
- `react-dom`
- `react-dom/client`
- `react/jsx-runtime`
- transitive package ids required by the above (for current locked versions)

### Bundling Runtime

- Wrap each module in function scope `(module, exports, require)`.
- Store wrappers in `__modules__` map keyed by module id.
- Implement `__require__` with execution cache.
- Execute entry module after runtime bootstrap.

### Outputs

- `app.js`: bundled JavaScript runtime + all discovered modules.
- `app.css`: merged CSS collected during graph traversal.
- `index.html`: optional generated file linking JS and CSS.

### Static Public Assets

- If `public/` exists next to app `src/`, its contents are copied recursively into `outputDir` on each build.
- App-level assets are declared with standard HTML in `src/index.html`.
- MVP favicon support is `favicon.ico` provided by the app (for example `public/favicon.ico`) and referenced in HTML.

Example:

```html
<link rel="icon" href="/favicon.ico" sizes="any">
```

### Compression

- Production mode always emits Brotli sidecar files (`.br`) for JS and CSS outputs.
- Gzip output is not supported.
- Development mode never emits compressed outputs.

### Simple Build Cache (V1)

- Cache is persisted between bundler runs in a local cache directory.
- Each bundler run creates one cache object that owns load, lookup, write, and finalize behavior.
- Cache lookups are keyed by module path + file fingerprint (mtime + size).
- Cache metadata is stored in one index JSON file.
- Cached transformed module source is stored as raw `.js` payload files (not JSON payload files).
- Recompute and overwrite cache entries when module fingerprint changes.
- At finalize, cache prunes index entries and payload files that were not used in the current run.
- Cache key mismatch or version mismatch invalidates previously stored index entries.

This is a correctness-first cache, not a watch-mode incremental compiler.

### Dev Server Cache Directories

- Each dev server instance builds into `<cacheDir>/dev-slots/slot-0` .. `slot-9` (fixed pool of 10), not a directory keyed by port, so disk usage from repeated `--port 0` runs is bounded.
- On start, an instance picks the first missing slot, or else the least-recently-used one by directory mtime; no locking, so near-simultaneous starts can rarely pick the same slot.
- Picking a slot clears its `output-0`/`output-1` build-output buffers (stale assets from a previous, possibly unrelated project) but keeps its module transform cache, since that cache is content-addressed and self-pruning.

### Plugin Architecture

- Built-in transforms still run in this order:
  1. `env-inject`
  2. user transforms
  3. `minifier`
- Dead-code elimination is part of `minifier` (not a separate transform).
- Transforms now use a two-phase lifecycle:
  1. `module` phase during module loading/graph exploration
  2. `complete` phase after graph resolution, before final asset writes
- In module phase, the bundler creates one empty mutable metadata object per module and passes it through all transforms.
- That metadata object is persisted in the module transform cache and restored on cache hits.
- Full-context phase receives the full dependency entry list and the metadata map keyed by module path.
- Full-context phase gets an output writer callback so transforms can emit files directly.
- Both built-in transforms and user transforms operate on AST-lite during module phase.
- AST-lite node types are intentionally limited to: `comment`, `blankline`, `conditional`, `blob`, `protected`.
- Unsupported or ambiguous syntax is preserved as `blob` nodes (fail-open behavior).

Current lifecycle hooks:

```typescript
interface ModuleTransform {
  version: string;
  transform(request: ModuleTransformModuleRequest): ProgramNode | Promise<ProgramNode>;
}

interface FullContextTransform {
  version: string;
  transform(request: FullContextTransformRequest): void | Promise<void>;
}

type ModuleTransformMetadata = Record<string, unknown>;

interface ModuleTransformModuleRequest {
  phase: 'module';
  path: string;
  program: ProgramNode;
  metadata: ModuleTransformMetadata;
}

interface FullContextTransformRequest {
  entryPath: string;
  outputFilePath: string;
  outputDirPath: string;
  writeOutputFile: (fileName: string, contents: string) => Promise<string>;
  dependencies: DependencyEntry[];
  moduleMetadataByPath: Record<string, ModuleTransformMetadata>;
}

interface ProgramNode {
  type: 'program';
  body: AstNode[];
}

type AstNode = CommentNode | BlankLineNode | ConditionalNode | BlobNode | ProtectedNode;
```

### Build Configuration

```typescript
interface BundlerConfig {
  entry: string;
  outputDir: string;
  mode?: 'production' | 'dev';
  target?: 'es6' | 'es2022';
  env?: Record<string, string | undefined>;
  outputName?: string;
  transpiledRoot?: string;
  generateHtml?: boolean;
  transforms?: Transform[];
  reactSupportMode?: 'bundled' | 'external';
  allowedNodeModules?: string[];
  cache?: {
    enabled?: boolean;
    dir?: string;
    strategy?: 'mtime-size' | 'content-hash';
  };
}

interface Transform {
  moduleTransform?: ModuleTransform;
  postModuleTransform?: PostModuleTransform;
}
```

Defaults:
- `mode`: resolve from `process.env.NODE_ENV` when valid, otherwise `production`
- `target`: `es2022`
- `reactSupportMode`: `bundled`
- `allowedNodeModules`: `['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']`
- `cache.enabled`: `true`
- `cache.dir`: `.cache/bundler`
- `cache.strategy`: `mtime-size`

Target presets:
- `es6`: transpile with TypeScript `--target ES2015 --lib DOM,DOM.Iterable,ES2015`
- `es2022`: transpile with TypeScript `--target ES2022 --lib DOM,DOM.Iterable,ES2022`

TypeScript requirement:
- The bundler requires TypeScript 7.x.
- Dev-mode fast transpilation relies on `tsc --noCheck`.

Mode/env precedence:
1. CLI/config `mode`
2. host `process.env.NODE_ENV`
3. fallback `production`

Env injection:
- The bundler only passes explicitly configured env values into env-inject.
- `NODE_ENV` is always forced from resolved mode (`production` => `"production"`, `dev` => `"development"`).

Mode-specific transpilation:
- `production` keeps the checked transpile path.
- `dev` uses `tsc --noCheck` for faster emit and relies on separate type-checking via editor, lint, or CI.

### CLI Usage

```bash
node src/core/bundler/cli.js --entry src/app/index.js --outputDir dist
```

---

## Out of Scope (V1)

- Generic npm package resolution for arbitrary packages.
- Package `exports` condition matrix parity with Node.
- Dynamic import and code splitting.
- Dependency cycle handling and cycle-safe graph diagnostics.
- Scope hoisting.
- Tree shaking.
- Source maps.
- Asset inlining.
- Hot reload and incremental rebuild.
- Cross-machine shared cache.
- Partial plugin-level cache invalidation.

---

## Design & Architecture

### Core Data Structures

```typescript
interface Module {
  id: string;
  path: string;
  code: string;
  requires: string[];
  cssImports: string[];
  kind: 'app' | 'node_module';
}

interface BundleGraph {
  modules: Map<string, Module>;
  entryId: string;
  order: string[];
  cssPaths: string[];
}

interface BundleOutput {
  js: string;
  css: string;
}

interface FileFingerprint {
  mtimeMs: number;
  size: number;
  hash?: string;
}

interface ModuleCacheEntry {
  id: string;
  path: string;
  fingerprint: FileFingerprint;
  requires: string[];
  wrapperCode: string;
}

interface CacheManifest {
  bundlerVersion: string;
  configFingerprint: string;
  entries: Record<string, ModuleCacheEntry>;
}
```

### API Signatures

```typescript
class Bundler {
  constructor(config: BundlerConfig);

  async bundle(): Promise<BundleOutput>;
  async write(): Promise<void>;

  private parseRequires(code: string): string[];
  private resolveModule(specifier: string, fromPath: string): string;
  private resolveNodeModule(specifier: string, fromPath: string): string;
  private loadModule(path: string): Promise<Module>;
  private buildGraph(entryPath: string): Promise<BundleGraph>;
  private topologicalOrder(graph: BundleGraph): string[];
  private generateRuntime(graph: BundleGraph): string;
  private runPlugins(code: string): Promise<string>;
  private collectCss(graph: BundleGraph): Promise<string>;
  private generateHtml(outputName: string): string;
  private loadCacheManifest(): Promise<CacheManifest>;
  private saveCacheManifest(manifest: CacheManifest): Promise<void>;
  private getFileFingerprint(path: string): Promise<FileFingerprint>;
}
```

### React Resolution Strategy (V1)

1. Resolve allowed React package ids from node_modules.
2. Follow their CommonJS entry chain.
3. Include only files actually required by graph traversal.
4. Reject unknown package ids with explicit guidance.

This is intentionally not a full Node resolver clone.

### Runtime Structure Example

```javascript
const __modules__ = {
  'src/app/index.js': function(module, exports, require) {
    const React = require('node_modules/react/index.js');
    const { createRoot } = require('node_modules/react-dom/client.js');
  },
  'node_modules/react/index.js': function(module, exports, require) {
    module.exports = require('./cjs/react.production.min.js');
  }
};

const __cache__ = {};

function __require__(id) {
  if (__cache__[id]) return __cache__[id].exports;
  const module = { exports: {} };
  __cache__[id] = module;
  __modules__[id](module, module.exports, __require__);
  return module.exports;
}

__require__('src/app/index.js');
```

### Implementation Strategy

1. Run TypeScript compile before bundling.
2. Parse `require('...')` edges from entry and dependencies.
3. Resolve modules using app resolver plus constrained React resolver.
4. Load cache manifest and validate bundler/config fingerprint.
5. For each module, reuse cached parse/wrapper if fingerprint is unchanged.
6. Build graph and sort dependencies.
7. Generate wrapper runtime and execute entry.
8. Merge CSS into output file.
9. Run JS plugins.
10. Persist updated cache manifest and write JS/CSS/optional HTML outputs.

### Cache Invalidation Rules (V1)

- Cache miss when module file does not exist in manifest.
- Cache miss when fingerprint differs from cached fingerprint.
- Full cache reset when:
  - bundler version changes, or
  - relevant config options change (entry, resolver mode, React support mode, cache strategy).

Safe behavior:
- If cache read fails or manifest is invalid JSON, bundler proceeds without cache and rewrites it.

### Diagnostics & Performance Output

`BundlerPerformanceCollector` records one entry per transformed module (absolute file
path, duration, source/processed size, cache-hit flag) plus a `transpile` entry for the
TypeScript pre-pass. It writes a progress dot per entry while the build runs.

`printSummary()` reports **per package**, not per module. A module's package is derived
purely from its path: the segment following the last `node_modules` segment (including
the `@scope/` prefix when present). Modules outside `node_modules` belong to a single
`application` group. Rows are sorted by total transform time, descending.

```
Modules processed: 19
Package                          Modules      Time  Cached  Size
application                           12   842.3ms      8%  184.0kb -> 96.2kb
react-dom                              4    12.1ms    100%  1204.0kb -> 610.5kb
@pokedb2/db                            3     4.7ms    100%  62.0kb -> 31.0kb
Asset sizes: (compressed)
- js: 1450.0kb (312.4kb)
- css: 12.0kb (3.1kb)
TSC transpile time: 125.3ms
Total bundle time: 1182.6ms
```

Cache hits still count toward a package's time, but that time only covers the `stat` and
cache read, so a fully cached package reports near-zero time. Raw per-module entries stay
available through `getEntries()`, and the aggregated package rows through
`getSummary().packages`. The dev server uses a silent collector and logs only module count
and build duration.

---

## Verification

### Unit Tests

- [ ] Parse literal require calls correctly.
- [ ] Resolve relative app paths.
- [ ] Resolve supported React package ids.
- [ ] Reject unsupported node_modules package ids.
- [ ] Build dependency graph and deterministic module order.
- [ ] Generate valid runtime with cache semantics.
- [ ] CSS collection merges imported files in stable order.
- [ ] Plugin execution order is deterministic.
- [ ] Cache hit: unchanged module reuses cached parse/wrapper result.
- [ ] Cache miss: changed module invalidates only that module entry.
- [ ] Cache reset: config fingerprint change triggers manifest reset.
- [ ] Cache fallback: corrupt manifest is ignored and rebuilt.

### Integration Tests

- [ ] Bundle a small React entry using `react` and `react-dom/client`.
- [ ] Execute bundle in browser and render to root element.
- [ ] Bundle with `reactSupportMode=external` and confirm externals are not in bundle.
- [ ] Circular dependency handling returns clear error.
- [ ] Two consecutive builds with no file changes produce cache-hit path and matching output.

### Performance Targets

- Bundle 100 modules including React graph in under 1.5s on local dev machine.
- Generate runtime wrapper in under 100ms.

---

## TODOs

### Core Implementation

- [ ] Create `Bundler` core class and config parser.
- [ ] Implement CJS require parser (literal specifiers only).
- [ ] Implement app module resolver.
- [ ] Implement constrained node_modules resolver for React package ids.
- [ ] Implement graph traversal and ordering.
- [ ] Implement runtime generator (`__modules__`, `__cache__`, `__require__`).
- [ ] Implement CSS import collection and merge.
- [ ] Implement plugin pipeline.
- [ ] Implement optional HTML generation.
- [ ] Implement cache manifest load/save.
- [ ] Implement file fingerprinting (`mtime-size` first, optional content hash).
- [ ] Implement module-level cache lookup and update.

### CLI and Build Integration

- [ ] Add CLI flags: entry, outputDir, outputName, reactSupportMode.
- [ ] Ensure build script runs TypeScript compile before bundler.
- [ ] Add clear diagnostics for unsupported package ids and unsupported syntax.

### Testing

- [ ] Unit tests for parser, resolver, graph, and runtime.
- [ ] React integration fixture test.
- [ ] Error-path tests for unsupported node_modules and dynamic require.

### Documentation

- [ ] Config guide for React support modes.
- [ ] Cache guide and invalidation behavior.
- [ ] Known limitations section.
- [ ] Troubleshooting for module resolution errors.

---

## Module Files

```text
src/core/bundler/
  bundler.ts
  parser.ts
  resolver.ts
  react-resolver.ts
  graph.ts
  runtime.ts
  css.ts
  cache.ts
  plugins.ts
  types.ts
  cli.ts
  index.ts
```

