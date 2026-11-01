# Redact Plugin Instructions

This package is a bundler transform that makes an app run on TanStack Redact
without Vite. All knowledge of Redact belongs here, not in `bundler/`.

## Contracts

- `redactPlugin()` only rewrites the string after a `require(`. The bundler runs
  transforms before collecting dependencies, so the rewritten specifier is what
  gets resolved. Do not add resolver hooks to the bundler for this.
- Outside `@tanstack/redact`, specifiers go through the `ALIASES` map. Inside it,
  the `<feature>/index.js` of a feature not in `include` becomes
  `<feature>/stub.js`. Only names in `FEATURES` are stubbed, so a feature added
  by a Redact upgrade stays on until it is listed there.
- Stubbing is intentionally this simple. A stubbed feature fails quietly: for
  example a stubbed `memo` stops skipping re-renders. If a Redact upgrade needs
  more than this suffix rewrite, drop the `include` option rather than growing it.
- Compare the `ALIASES` map and feature names with Redact's Vite plugin
  (`dist/vite/index.js`) when upgrading Redact.
- AST-lite types and `AST_LITE_VERSION` are duplicated across this package,
  `css-in-js/src/ast-types.ts` and `bundler/src/ast-lite/types.ts`. Update them
  together; the transform rejects an incompatible program version.

## Commands

From the repository root:

```powershell
npm run build --prefix redact-plugin
npm run test --prefix redact-plugin
npm run lint --prefix redact-plugin
```
