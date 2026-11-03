# @project-dragalge/redact-plugin

This package is a bundler transform that runs a React app on TanStack Redact.
It rewrites `require` specifiers at build time: React entry points become
Redact's, and Redact features the app does not use become Redact's smaller
stubs. In production builds it also replaces Redact's devtools and fast-refresh
modules with an empty stub.

```js
const { configure } = require('@project-dragalge/bundler/configure');
const { redactPlugin } = require('@project-dragalge/redact-plugin');

module.exports = configure({
    entry: 'src/index.tsx',
    transforms: [redactPlugin({ include: ['context', 'lazy', 'suspense'] })],
});
```

Application code keeps importing `react` and `react-dom`, and types still come
from `@types/react`.

## Interfaces

This plays the role of Redact's Vite plugin for the workspace bundler, but it
only rewrites specifiers: it has no resolver hooks and does not change module
code. A feature left out of `include` fails quietly; a stubbed `memo`, for
example, stops skipping re-renders. The production stub relies on Redact
calling its devtools and refresh exports only behind
`NODE_ENV !== "production"` guards, so check those modules when upgrading
Redact. Replacing Redact with React means removing the transform; the app
code needs no changes.
