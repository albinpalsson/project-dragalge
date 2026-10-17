# CSS-in-JS Instructions

This package extracts component CSS at build time through the bundler transform
API. It does not provide runtime style injection.

## Contracts

- `src/index.ts` exports `css()` and `cx()`. `css()` is a build-time marker for
  static CSS; interpolated template values are unsupported. `cx()` joins
  non-empty string class names at runtime.
- `src/transform.ts` owns `cssInJsTransform()`, its module metadata, and its
  post-module CSS collection. Keep extracted CSS and rewritten class names
  consistent across both transform phases.
- AST-lite types and `AST_LITE_VERSION` are duplicated across this package and
  `bundler/src/ast-lite/types.ts`. Coordinate changes and update both versions
  together; the transformer rejects an incompatible program version.
- Protected AST nodes represent strings, templates, and regular expressions.
  Only rewrite the intended static CSS template after recognizing its call
  site; dynamic `${...}` values must remain unsupported unless the transform
  contract is deliberately redesigned.
- Check `src/transform.test.ts` and `src/cx.test.ts` when changing accepted
  syntax, class generation, metadata, or output CSS. Keep tests focused on
  observable transformed output.

## Commands

From the repository root:

```powershell
npm run build --prefix css-in-js
npm run test --prefix css-in-js
npm run lint --prefix css-in-js
```

After changing the shared AST contract, rebuild both `css-in-js` and `bundler`
before testing app behavior.