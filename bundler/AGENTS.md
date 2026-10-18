# Bundler Instructions

The bundler package owns the app bundling pipeline, transforms, development
server, and emitted runtime. Keep changes aligned with the actual pipeline and
verify emitted behavior, not only TypeScript compilation.

## Pipeline and Runtime

- `src/main.ts` defines `BundlerConfig`, transform contracts, and
  `runBundler()`. Trace the pipeline through `src/bundle.ts` and its focused
  modules before changing build ordering or output behavior.
- The dependency graph applies module transforms and then post-module
  transforms across collected dependencies. Use those hooks rather than adding
  CSS or minifier workarounds to unrelated output stages.
- The emitted module runtime is CommonJS-style. When changing dependency
  resolution or generated wrappers, verify resolved dependencies are compatible
  with that runtime; a successful bundle is not sufficient proof of runtime
  correctness.
- Public assets are copied from the `public/` directory beside the entry file.
  Check the output and dev-server serving behavior when changing asset handling.
- Treat the resolver as intentionally constrained. Confirm supported package
  and extension resolution in `src/node-modules-resolver.ts`; do not assume it
  behaves like Node's full ESM resolver.

## Transforms and AST-lite

- Transforms are versioned and can implement `moduleTransform` and/or
  `postModuleTransform`. Keep transform metadata scoped to the pipeline
  contract and preserve dependency ordering.
- The AST-lite parser represents strings, templates, and regular expressions
  as protected nodes. Minification or rewriting must not alter their contents.
  Extend the parser/minifier integration tests with source cases for syntax
  changes.
- `AST_LITE_VERSION` is shared with `css-in-js/src/ast-types.ts`. Coordinate
  incompatible AST changes with `css-in-js`, update both contracts together,
  and rebuild both packages.
- The bundler test suite has integration tests that bundle a temporary project
  and execute its output. Add parser and minifier regression cases there;
  do not rely on a successful build alone.

## Development Server

- `src/dev-server/` owns watch/rebuild and browser reload behavior; it is not
  the production build command. Preserve the server's startup, rebuild failure,
  and shutdown behavior when changing its lifecycle.
- App Playwright tests use the dev-server CLI with watching disabled and a
  dynamically assigned port. Keep its readiness output compatible with
  `paldea-nuzlocke-guide/playwright.config.ts`.
- Keep static serving behavior shared with the production serve path where
  appropriate; verify compressed and uncompressed asset responses when
  changing output or serving logic.

## Commands

From the repository root:

```powershell
npm run build --prefix bundler
npm run test --prefix bundler
npm run lint --prefix bundler
```

The bundler build transpiles with `--noCheck`; its lint script runs the package
TypeScript check.