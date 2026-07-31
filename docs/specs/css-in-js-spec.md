# CSS-in-JS Specification (Build-Time Transformer)

## Research & Context

### Why Build-Time CSS Extraction?

We need to:
- Write styles inline with components (DX: `css\`...\`` or `css({ ... })` in source)
- Extract all CSS at build time (no runtime CSS generation overhead)
- Produce a separate `.css` file (smaller JS bundle, separate asset)
- Replace `css()` calls with class names before bundling
- Avoid runtime CSS injection completely (performance + security)
- **Compatible with existing solutions** (emotion, styled-components, Linaria) for future migration

### Design Approach
- **Template literal syntax**: `css\`color: red;\`` (looks like real CSS, easier to read)
- **Object syntax alternative**: `css({ color: 'red' })` (for programmatic use)
- **CSS variables**: Share styles via standard `var(--name)` in CSS, define in global CSS
- **Component reuse**: Wrap styled elements in React components for shared patterns
- **Build-time transformer**: Runs before TypeScript compilation
- **Source transformation**: `css\`...\`` → `'className_hash className_hash ...'` + collect CSS
- **Output**: Separate `.css` file + transpiled `.js` without CSS code
- **No runtime dependency**: App receives only class names and `<link>` tag

### Similar to
- Emotion (template literal syntax, build-time extraction)
- Styled-components (familiar syntax for easy migration)
- Linaria (all CSS computed at build time)

---

## Requirements (In-Scope)

### Transformer Input/Output

**Input**: TypeScript source file (template literal syntax)
```typescript
import { css } from '@pokedb/css';

const buttonClass = css`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

export function Button(props) {
  return <button className={buttonClass}>{props.children}</button>;
}
```

**Alternative**: Object syntax (for programmatic use)
```typescript
const buttonClass = css({
  backgroundColor: '#007bff',
  color: 'white',
  padding: '10px 20px',
  '&:hover': { backgroundColor: '#0056b3' }
});
```

**Output**: Transformed TypeScript
```typescript
import './app.css';

const buttonClass = '_bg_abc123 _pad_def456 _hover_ghi789';

export function Button(props) {
  return <button className={buttonClass}>{props.children}</button>;
}
```

**Output**: Extracted CSS file (app.css)
```css
._bg_abc123 {
  background-color: #007bff;
}
._color_def456 {
  color: white;
}
._pad_ghi789 {
  padding: 10px 20px;
}
._hover_jkl012:hover {
  background-color: #0056b3;
}
```

### Style Features
- CSS properties (color, fontSize, padding, etc.)
- Pseudo-selectors: `:hover`, `:focus`, `:active`
- Media queries: `@media (max-width: 768px) { ... }`
- Nested selectors (for pseudo-states, media queries)
- CSS variables: `var(--primary-color)` (define in global CSS or generated file)
- Composition via `cx()` (simple class merging: `cx(buttonClass, 'disabled')`)
- Component reuse (wrap styled elements in React components)

### Style Object Format

```typescript
interface CSSProperties {
  color?: string;
  backgroundColor?: string;
  fontSize?: string;
  padding?: string;
  margin?: string;
  display?: string;
  flexDirection?: string;
  [key: string]: string | number | CSSProperties | undefined;
}

interface StylesObject {
  [key: string]: CSSProperties | StylesObject;
  '&:hover'?: CSSProperties;
  '&:focus'?: CSSProperties;
  '&:active'?: CSSProperties;
  '@media (max-width: 768px)'?: CSSProperties | StylesObject;
}
```

### API in Source Code

```typescript
// ===== Template Literal (Preferred) =====
// Define styles (will be extracted)
const buttonClass = css`
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

// Use CSS variables (defined once in global CSS or shared stylesheet)
const specialClass = css`
  background-color: var(--primary-color);
  color: var(--text-color);
  padding: var(--spacing-md);
`;

// ===== Object Syntax (Alternative) =====
const buttonClass = css({
  backgroundColor: '#007bff',
  color: 'white',
  '&:hover': { backgroundColor: '#0056b3' }
});

// ===== Composition =====
// Simple class merging
const primaryButtonClass = cx(buttonClass, 'disabled');

// Reuse via React components (recommended for complex styles)
export function PrimaryButton(props) {
  return <Button className={buttonClass} {...props} />;
}
```

### Build Configuration

```typescript
interface CSSTransformerConfig {
  input: string; // Source directory (e.g., 'src')
  output: string; // Output CSS file (e.g., 'dist/app.css')
  classNamePattern?: string; // Pattern for class names (default: '_component_hash')
  sourceMap?: boolean; // Generate source maps (default: false)
}
```

---

## Out of Scope (V1)

- Runtime CSS injection (all CSS must be at build time)
- Dynamic CSS value generation (only static values)
- CSS variables definition API (define in global CSS files, reference via `var(--name)`)
- AST-based style exports/imports (use React components instead)
- CSS modules interop
- SCSS/LESS preprocessing
- Server-side rendering SSR helpers
- Complex selectors beyond pseudo-elements/media queries
- Styled-components plugin (our syntax is compatible for future migration)

---

## Design & Architecture

### Core Components

```typescript
// Support both template literals and objects
interface StyleDefinition {
  [property: string]: string | number | StyleDefinition;
}

interface ExtractedStyle {
  className: string; // e.g., '_btn_abc123'
  css: string; // Raw CSS text
  source: string; // Source file + line number (for debugging)
  syntax: 'template' | 'object'; // Which syntax was used
}

interface TransformerConfig {
  input: string; // Source directory (e.g., 'src')
  output: string; // Output CSS file (e.g., 'dist/app.css')
  globalCssFile?: string; // Optional: global CSS file for variables (e.g., 'src/global.css')
  classNamePattern?: string; // Pattern for class names (default: '_component_hash')
  sourceMap?: boolean; // Generate source maps (default: false)
}
```

### Transformer Pipeline

The current implementation is a bundler transform with two lifecycle phases, not a standalone source-file prepass.

```typescript
interface ModuleTransform {
  version: string;
  fn(request: TransformModuleRequest): ProgramNode | Promise<ProgramNode>;
}

interface CssTransform {
  moduleTransform?: ModuleTransform;
  postModuleTransform?: (request: CssTransformFullContextRequest) => void | Promise<void>;
}

interface TransformModuleRequest {
  phase: 'module';
  path: string;
  program: ProgramNode;
  metadata: Record<string, unknown>;
}

interface CssTransformFullContextRequest {
  entryPath: string;
  outputFilePath: string;
  outputDirPath: string;
  writeOutputFile: (fileName: string, contents: string) => Promise<string>;
  dependencies: DependencyEntry[];
  moduleMetadataByPath: Record<string, Record<string, unknown>>;
}
```

### Implementation Strategy

1. **Module phase parse/rewrite**: Find `css\`...\`` callsites in the AST-lite program and replace them with deterministic class name strings, potentially multiple classes from one template.
2. **Per-module metadata capture**: Write namespaced metadata into the module metadata bag, including the target CSS file name and the generated atomic and complex-unit rules for that module.
3. **No module-phase CSS writes**: The transform does not write `pokestyle.css` or inject a per-module CSS require.
4. **Stable class names**: Generate atomic class names from `property:value` pairs and generate complex-unit class names from hashed nested selector or media statement content.
5. **Full-context aggregation**: Read all module metadata after graph resolution, deduplicate rules across the module graph, and write one final CSS file via `writeOutputFile`.
6. **Deterministic output**: Deduplicate by classname and emit stable CSS across builds and cache states.
7. **Runtime stays CSS-free**: App code receives class names only; CSS emission happens through the bundler asset channel.

### Example: Extraction Process (Template Literal)

```typescript
// Source file: button.ts
const buttonClass = css`
  background-color: #007bff;
  padding: 10px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

// 1. Extract template literal string
const cssText = `
  background-color: #007bff;
  padding: 10px;
  
  &:hover {
    background-color: #0056b3;
  }
`;

// 2. Parse: Replace '&' with selector
const parsedCss = `
._bg_abc123 {
  background-color: #007bff;
}
._pad_def456 {
  padding: 10px;
}
._hover_ghi789:hover {
  background-color: #0056b3;
}`;

// 3. Generate class names
const className = '_bg_abc123 _pad_def456 _hover_ghi789';

// 4. Deduplicate: Identical declarations or identical complex statements reuse the same class name

// 5. Replace in source
// OLD: const buttonClass = css\`...\`;
// NEW: const buttonClass = '_bg_abc123 _pad_def456 _hover_ghi789';
```

### Example: CSS Variables (for sharing)

```typescript
// global.css (or shared stylesheet)
:root {
  --primary-color: #007bff;
  --text-color: #333;
  --spacing-md: 10px 20px;
}

// button.ts - use CSS variables
const buttonClass = css`
  background-color: var(--primary-color);
  color: var(--text-color);
  padding: var(--spacing-md);
  
  &:hover {
    opacity: 0.9;
  }
`;

// To change theme: just update CSS variables in global.css
// To share button style: wrap in React component
export function PrimaryButton(props) {
  return <button className={buttonClass} {...props} />;
}
```

### Class Name Generation

- Hash atomic declarations by `property:value`, and hash each complex selector/media statement by its normalized content.
- Pattern: `_component_hash` (e.g., `_btn_abc123`)
- Same declaration or same complex statement = same class name (automatic deduplication across all files)
- Provides consistent builds (hash always same for same CSS)
- Works across both syntax styles (template literal → normalized → hashed)

---

## Verification

### Unit Tests
- [ ] Parse template literals: Extract raw CSS from backtick strings
- [ ] Parse style objects: Convert JS objects to CSS text (camelCase → kebab-case)
- [ ] Generate class names: Deterministic hashing of CSS content
- [ ] Pseudo-selectors: `:hover`, `:focus`, `&:` syntax handled correctly
- [ ] Media queries: Nested styles wrap correctly in `@media`
- [ ] CSS variables: `var(--name)` references preserved as-is
- [ ] Deduplication: Identical CSS (any syntax) gets same class name
- [ ] Source file parsing: Find all `css\`...\`` and `css({ ... })` calls
- [ ] Source transformation: Replace calls with class name literals, add imports

### Integration Tests
- [ ] Full transformation: Parse files → extract CSS → write files → verify output
- [ ] Multiple files: CSS from multiple sources merged correctly
- [ ] Class name consistency: Same CSS in different files = same class name
- [ ] Import injection: CSS import added to entry point

### Build Verification
- [ ] Transformer runs before tsc
- [ ] Output CSS file is valid
- [ ] Transformed source files are valid TypeScript (no syntax errors)
- [ ] Generated HTML links to CSS file

---

## TODOs

### Core Implementation
- [ ] Create `CSSTransformer` class
- [ ] Implement source file parser (find `.ts` files)
- [ ] Implement template literal extractor (find `css\`...\`` calls)
- [ ] Implement object call extractor (find `css({ ... })` calls)
- [ ] Implement template literal parser (normalize CSS from strings)
- [ ] Implement object serializer (JS object → CSS text, camelCase → kebab-case)
- [ ] Implement class name generator (deterministic hash of CSS)
- [ ] Implement CSS deduplicator (merge identical CSS)
- [ ] Implement source file transformer (replace css() calls with class names)
- [ ] Implement CSS file writer (combine all extracted CSS)
- [ ] Implement CSS import injection (add `import './app.css'` where needed)

### Build Integration
- [ ] Create CLI/build task to run transformer
- [ ] Integrate into build pipeline (before tsc)
- [ ] Verify transformer doesn't break TypeScript compilation
- [ ] Support optional global CSS file for variables

### Testing
- [ ] Unit tests for template literal parsing
- [ ] Unit tests for object serialization
- [ ] Unit tests for hasher (deterministic across both syntaxes)
- [ ] Unit tests for CSS variable preservation
- [ ] Integration tests: Full file transformation (both syntaxes)
- [ ] Test edge cases: Complex nesting, media queries, pseudo-selectors

### Documentation
- [ ] API docs for transformer config
- [ ] Usage guide: Template literal syntax (preferred)
- [ ] Usage guide: Object syntax (alternative)
- [ ] Usage guide: CSS variables for sharing
- [ ] Usage guide: Component reuse for complex styles
- [ ] Build pipeline integration guide
- [ ] Migration path to emotion/styled-components

---

## Module Files

```
src/core/css-in-js/
  ├── transformer.ts      # Main CSSTransformer class
  ├── parser.ts           # Extract css calls (template & object)
  ├── template-parser.ts  # Parse template literal CSS strings
  ├── object-serializer.ts # Convert JS objects to CSS
  ├── hasher.ts           # Generate deterministic class names
  ├── dedup.ts            # Deduplication logic
  ├── types.ts            # TypeScript interfaces
  ├── cli.ts              # Command-line interface
  └── index.ts            # Exports
```

