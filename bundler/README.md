# @project-dragalge/bundler

This package bundles the guide and runs its development server. It also
provides build transforms, so other tools can take part in the bundle process.

```js
const { configure } = require('@project-dragalge/bundler/configure');

module.exports = configure({
    entry: 'src/index.tsx',
    outputDir: 'dist',
    transforms: [],
});
```

Build with `project-dragalge-bundle --mode production` and start the
development server with `project-dragalge-dev-server`.

## Interfaces

The bundler has a role like Vite or Webpack: it builds an application and lets
transforms change modules during that build. Its configuration, resolver,
runtime, and transform APIs are its own, not compatible with Vite or Webpack
plugins. Replacing it means changing the build configuration and any custom
transforms. The `@project-dragalge/css-in-js` package uses its transform
interface to extract CSS.

## Architecture

The build pipeline uses the TypeScript 7 API to transpile TypeScript into CommonJS JavaScript modules in memory. Production builds include semantic type checking; development mode skips that check for faster rebuilds.

From there, the bundler:

1. Walks the entry point's dependency graph and resolves its modules.
2. Runs each JavaScript module through the environment-injection transform,
   configured transforms, and the built-in minifier. Transforms can also
   provide a post-module hook to work with the collected dependency graph.
3. Generates a CommonJS-style runtime bundle, writes linked HTML and merged
   CSS, and, in production mode, writes Brotli-compressed JavaScript and CSS.

The built-in minifier removes non-license comments, compacts whitespace, and
folds simple static conditionals, eliminating branches that cannot run. This
is basic minification and dead-branch elimination, not general-purpose
tree-shaking.

For example, from the repository root, the Paldea Nuzlocke Guide's production
build prints a summary like this:

```text
$ npm run build
> project-dragalge-bundle --mode production
..................................................
Modules processed: 239
Package                          Modules Processing  Cached  Size
application                          206    106.0ms      0%  683.6 KiB -> 509.7 KiB
react-dom                              4     75.7ms      0%  532.6 KiB -> 425.3 KiB
scheduler                              2      1.1ms      0%  10.1 KiB -> 8.1 KiB
react                                  4      3.0ms      0%  18.2 KiB -> 14.9 KiB
@project-dragalge/db                   7      7.1ms      0%  31.9 KiB -> 22.6 KiB
@project-dragalge/pokemon-data         2      6.1ms      0%  192.0 KiB -> 191.6 KiB
@project-dragalge/server-query         3      2.1ms      0%  5.0 KiB -> 3.5 KiB
@project-dragalge/query-builder        8      1.9ms      0%  9.0 KiB -> 7.5 KiB
@project-dragalge/validator            1      0.7ms      0%  6.4 KiB -> 4.7 KiB
@project-dragalge/css-in-js            1      0.1ms      0%  0.5 KiB -> 0.4 KiB
Asset sizes: output (compressed)
- js: 1163.0 KiB (178.4 KiB)
- css: 20.3 KiB (5.7 KiB)
- copied assets: 849.3 KiB
TypeScript API transpile time: 799.1ms
Brotli compression time: 1886.4ms
Total bundle time: 3646.3ms
```

