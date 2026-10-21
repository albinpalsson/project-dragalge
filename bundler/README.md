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
Package                            Modules      Time  Cached  Size
application                          206  2646.1ms    100%  684.1kb -> 509.7kb
@project-dragalge/pokemon-data         2    55.6ms    100%  192.0kb -> 191.6kb
@project-dragalge/query-builder        8    34.6ms    100%  9.0kb -> 7.5kb
@project-dragalge/db                   7    28.0ms    100%  31.9kb -> 22.6kb
react-dom                              4    21.7ms    100%  532.6kb -> 425.3kb
scheduler                              2    15.8ms    100%  10.1kb -> 8.1kb
react                                  4    12.5ms    100%  18.2kb -> 14.9kb
@project-dragalge/validator            1    12.1ms    100%  6.4kb -> 4.7kb
@project-dragalge/server-query         3     8.7ms    100%  5.0kb -> 3.5kb
@project-dragalge/css-in-js            1     3.0ms    100%  0.5kb -> 0.4kb
Asset sizes: (compressed)
- js: 1486.5kb (178.4kb)
- css: 3.5kb (5.7kb)
TypeScript API transpile time: 777.9ms
Total bundle time: 3963.2ms
```
