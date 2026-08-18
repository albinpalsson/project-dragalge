# Agent Instructions

## App architecture
Before implementing app features, read [docs/specs/app-architecture-spec.md](docs/specs/app-architecture-spec.md) — it defines the views, router, DB schema, data access layer, styling, and testing strategy for the `app` package.

## Node.js version
Use the nvm-managed Node 26 binary:
```
C:\Users\albin.palsson\.nvm\versions\node\v26.4.0\bin\node.exe
```

Prepend its directory to `PATH` for the current command/session so `npm`/`npx` resolve to that install:
```powershell
$env:PATH = "C:\Users\albin.palsson\.nvm\versions\node\v26.4.0\bin;$env:PATH"
```

## Verification
Run these from the repo root after making changes. All must pass before considering a change complete:
```powershell
npm run build --prefix app
npm run test --prefix app
npm run lint
```

- `npm run build --prefix app` — builds the app package via the bundler
- `npm run test --prefix app` — runs the app package's tests (including Playwright flows)
- `npm run lint` — runs Biome lint across the whole workspace (not scoped to `app`)
