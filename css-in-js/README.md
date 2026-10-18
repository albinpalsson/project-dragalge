# @project-dragalge/css-in-js

This package extracts static CSS from tagged templates during a build. It does
not add styles at runtime. `cx()` joins class names for use in components.

```ts
import { css, cx } from '@project-dragalge/css-in-js';

const cardClass = css`
    padding: 1rem;
    color: black;
`;
const className = cx(cardClass, isActive && 'active');
```

To extract the CSS, add `cssInJsTransform()` from
`@project-dragalge/css-in-js/transform` to the bundler configuration.

## Interfaces

The static tagged-template style is similar to Linaria, but this package has a
smaller feature set and its own build transform. Dynamic template values are
not supported. Replacing the compiler means changing the build integration;
the component code uses a familiar pattern, not Linaria's compiler or plugin
API.