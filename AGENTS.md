# Workspace Instructions

This repository is an npm-workspaces monorepo. Package-specific guidance lives in:
[app](app/AGENTS.md), [bundler](bundler/AGENTS.md),
[css-in-js](css-in-js/AGENTS.md), [db](db/AGENTS.md), and
[query-builder](query-builder/AGENTS.md). Follow the nearest applicable file.

## Node.js

Use the nvm-managed Node 26 binary:
`C:\Users\albin.palsson\.nvm\versions\node\v26.4.0\bin\node.exe`.
Prepend its directory to `PATH` for the current PowerShell session:

```powershell
$env:PATH = "C:\Users\albin.palsson\.nvm\versions\node\v26.4.0\bin;$env:PATH"
```

## Cross-Package Changes

The app consumes built workspace-package output. After changing `db`,
`query-builder`, `css-in-js`, or `bundler`, rebuild the changed package before
testing app behavior; otherwise the app may still use stale `dist` files.
Use `npm run build:all` when a change spans the workspace dependency chain.

## Verification

Run all three commands from the repository root after changes:

```powershell
npm run build --prefix app
npm run test --prefix app
npm run lint
```

The app build runs through the custom bundler and is not a TypeScript check.
Root `npm run lint` runs Biome; a package's `npm run lint --prefix <package>`
runs that package's TypeScript check.
