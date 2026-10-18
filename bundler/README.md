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