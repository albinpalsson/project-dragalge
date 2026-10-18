# @project-dragalge/validator

This package builds schemas for checking values at runtime. Schemas can be
combined to validate objects, arrays, unions, and basic types while keeping the
validated output type in TypeScript.

```ts
import { object, parse, string } from '@project-dragalge/validator';

const userSchema = object({ name: string() });
const user = parse(userSchema, { name: 'Mira' });
```

Use `safeParse()` when validation failures should be returned instead of
throwing a `ValidationError`.

## Interfaces

Schemas expose a version 1 `~standard` validation interface shaped around the
Standard Schema specification. This gives other tools a known place to call
validation, but does not make this package's schema-builder API match Zod or
Valibot. Its validation is synchronous and its feature set is small. A fuller
validator can replace it by changing the schema construction and parse calls;
the `~standard` boundary may help integrations that support it.