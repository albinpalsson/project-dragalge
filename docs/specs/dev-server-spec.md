# Dev Server Specification

## Research & Context

### Why Custom Dev Server?

We need a lightweight development server that:
- Serves the bundled app locally
- Supports hot-reload (restart on file changes)
- Does NOT require complex build tools
- Works with our custom bundler + minifier
- Minimal dependencies (just Node.js http module)

### Design Approach
- **Simple HTTP server**: Serve bundled HTML + assets
- **File watcher**: Detect changes, trigger rebuild
- **Hot-reload trigger**: Send signal to browser (polling or WebSocket)
- **CORS/headers**: Enable localStorage, local asset access

### Why NOT Use Webpack Dev Server?
Our setup is simple enough that a custom dev server is lightweight and gives us full control. Think of it as a learning exercise + tailored solution.

---

## Requirements (In-Scope)

## Requirements (In-Scope)

### Server Capabilities
- Serve generated files on `http://localhost:3000`
  - `index.html` (serves at `/`)
  - `app.js` (serves at `/app.js`)
  - `app.css` (serves at `/app.css`)
- CORS headers for local development
- Support for localhost + 127.0.0.1

### File Watching & Rebuild
- Watch source files for changes (`.ts`, `.tsx` files)
- Watch app `public/` files and directories
- Trigger full rebuild on change (CSS transformer → tsc → bundler)
- Report build errors to console
- Graceful error handling (don't crash on build failure)

Notes:
- Public asset changes do not use incremental sync; they use the same full rebuild path as source changes.

### Hot-Reload
- Full page reload on file change (simple, effective)
- Browser polls dev server for build status
- Automatic refresh when build completes

### Static Asset Serving

- Non-HTML assets in build output are served directly by path.
- `favicon.ico` is served as a regular static file with `image/x-icon` content type.

### Configuration

```typescript
interface DevServerConfig {
  port?: number; // Default: 3000
  host?: string; // Default: 'localhost'
  watch?: boolean; // Default: true; false disables automatic file watching/rebuilds
  srcDir?: string; // Source directory to watch (default: 'src')
  buildDir?: string; // Build output directory (default: 'dist')
  watchPaths?: string[]; // Additional paths to watch
  rebuildOnChange?: boolean; // Default: true
  liveReload?: boolean; // Default: true
}
```

### CLI Usage

```bash
npm run dev
# Or
npx ts-node src/core/dev-server/cli.ts --port 3000
# Build once and serve without watching for changes
pokedb2-dev-server --port 0 --no-watch
```

With `--no-watch`, the server still completes its initial build before reporting
ready, then serves that output without automatically rebuilding when source or
public files change. Restart the server to pick up those changes.

---

## Out of Scope (V1)

- HTTPS/SSL support
- Proxy to external APIs
- Middleware system
- Request logging
- Caching/compression
- Multiple bundles
- WebSocket for live reload (start with page reload)
- REST API endpoints (not needed for tracker)

---

## Design & Architecture

### Core Components

```typescript
interface BuildResult {
  success: boolean;
  files?: { js: string; css: string; html: string }; // Paths to generated files
  error?: string; // Error message
  buildTime: number; // ms
}

interface FileWatcher {
  watch(paths: string[], callback: (changedFile: string) => void): () => void; // returns stop function
}

interface BuildPipeline {
  cssTransform(): Promise<void>;
  tscCompile(): Promise<void>;
  bundleModules(): Promise<void>;
  minify(): Promise<void>;
  generateHtml(): Promise<void>;
}
```

### API Signatures

```typescript
class DevServer {
  constructor(config: DevServerConfig);

  start(): Promise<void>;
  stop(): Promise<void>;
  rebuild(): Promise<BuildResult>; // Run full pipeline

  private createHttpServer(): http.Server;
  private watchFiles(): void;
  private onFileChange(file: string): void;
  private runBuildPipeline(): Promise<BuildResult>;
  private serveFile(res: http.ServerResponse, path: string): void;
  private sendBuildStatus(buildTime: number): void;
}

// Utility functions
function createFileWatcher(): FileWatcher;
function getFileExtension(path: string): string;
function isWatchableFile(path: string): boolean;
```

### Implementation Strategy

1. **HTTP Server**: Create server on port 3000
2. **Build Pipeline on Start**: Run full build (CSS transformer → tsc → bundler → minifier)
3. **Serve Files**:
   - `GET /` → serve `dist/index.html`
   - `GET /app.js` → serve `dist/app.js`
   - `GET /app.css` → serve `dist/app.css`
   - `GET /__dev/status` → return build timestamp
4. **File Watcher**: Watch `src/` directory for `.ts`, `.tsx`, `.css` changes
5. **On File Change**:
   - Re-run full build pipeline
   - Update build timestamp
   - Browser detects change via polling, reloads
6. **Error Handling**: Log errors, don't crash server

### Hot-Reload Implementation (Polling)

Browser polls dev server every second:
```javascript
// Injected in bundled HTML
setInterval(() => {
  fetch('/__dev/status')
    .then(r => r.json())
    .then(data => {
      if (data.buildTime > lastKnownBuildTime) {
        location.reload();
      }
    });
}, 1000);
```

Dev server returns build timestamp:
```javascript
app.get('/__dev/status', (req, res) => {
  res.json({ buildTime: lastBuildTime });
});
```

### Example: Server Startup

```typescript
const server = new DevServer({
  port: 3000,
  srcDir: 'src',
  buildDir: 'dist',
  watchPaths: ['src'],
  liveReload: true
});

server.start().then(() => {
  console.log('Dev server running on http://localhost:3000');
  console.log('Watching for changes in src/');
});
```

### Directory Structure (Served)

```
GET /               → dist/index.html
GET /app.js         → dist/app.js
GET /app.css        → dist/app.css
GET /__dev/status   → { buildTime: 1234567 } (for hot-reload polling)
```

---

## Verification

### Unit Tests
- [ ] HTTP server creation and startup
- [ ] File watcher detection of changes
- [ ] Build pipeline orchestration (CSS → tsc → bundler)
- [ ] File serving with correct headers
- [ ] Error handling (build failures don't crash server)
- [ ] Status endpoint returns correct timestamp

### Integration Tests
- [ ] Start server, request `/` → get index.html with links to app.js + app.css
- [ ] Request `/app.js` → get bundled JavaScript
- [ ] Request `/app.css` → get concatenated CSS
- [ ] Modify source file → server detects, rebuilds
- [ ] Browser polling on `/__dev/status` → detects rebuild, page reloads

### Manual Testing
- [ ] Open browser to http://localhost:3000
- [ ] App loads and displays correctly
- [ ] Modify `.ts` source file
- [ ] Page auto-reloads with changes
- [ ] Verify CSS changes appear
- [ ] Check console for build time

### Performance Targets
- Server startup: <1 second
- File watch detection: <100ms
- Full build pipeline (CSS → tsc → bundler): <5 seconds
- Status check: <10ms

---

## TODOs

### Core Implementation
- [ ] Create `DevServer` class with config
- [ ] Implement HTTP server (Node.js http module)
- [ ] Implement build pipeline orchestration:
  - [ ] CSS transformer (build-time css() extraction)
  - [ ] TypeScript compilation (tsc)
  - [ ] Bundler (ESM import tracing)
  - [ ] Minifier (optional JS optimization)
- [ ] Implement file watcher (fs.watch or similar)
- [ ] Implement file serving (index.html, app.js, app.css)
- [ ] Implement build status endpoint (for polling)
- [ ] Implement error logging

### CLI & Integration
- [ ] Create CLI tool (`npm run dev`)
- [ ] Parse command-line arguments (port, srcDir, buildDir)
- [ ] Output startup message with URL + watching status

### Testing
- [ ] Unit tests for server startup/shutdown
- [ ] Unit tests for build pipeline orchestration
- [ ] Integration tests: Full dev workflow (edit → rebuild → reload)
- [ ] Manual testing on actual browser

### Documentation
- [ ] README: How to start dev server
- [ ] Troubleshooting: Port already in use, build errors
- [ ] Configuration guide

---

## Module Files

```
src/core/dev-server/
  ├── server.ts           # Main DevServer class
  ├── watcher.ts          # File watching
  ├── pipeline.ts         # Build pipeline orchestration
  ├── file-server.ts      # HTTP file serving
  ├── hot-reload.ts       # Status endpoint + polling
  ├── types.ts            # TypeScript interfaces
  ├── cli.ts              # Command-line interface
  └── index.ts            # Exports
```

