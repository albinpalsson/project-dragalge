# JavaScript Minifier Specification

## Research & Context

### Why Custom Minifier?

We need lightweight JavaScript minification that:
- Reduces bundle size with low risk
- Runs quickly as part of build (not a bottleneck)
- Handles modern JavaScript (ES6+, arrow functions, template literals)
- Avoids AST/parser complexity for v1

### Goal

Reduce output size with low risk, while avoiding AST/parser complexity.

### Core Rule

Only apply transforms that are syntax-insensitive or can be made safe with strong guards.

### AST-Lite Model (V1)

The minifier operates on an AST-lite tree (not a full JavaScript AST):
- `comment`
- `blankline`
- `conditional`
- `blob`

Transforms mutate nodes conservatively and can remove nodes by dropping them from arrays.

### Design Approach
- **AST-lite + scanner**: Parse to a small node model using scanner-guided boundaries.
- **Conservative**: Fail open when scan ambiguity is detected.
- **Safe**: Never touch protected regions (strings/templates/comments/regex literals).
- **Fast**: Bounded parser with small node classes and simple writer.

---

## Requirements (In-Scope)

### Operations (in order)

1. **Safe Comment Handling**
  - Remove line comments only when scanner confirms code context.
  - Remove block comments only when scanner confirms code context.
  - Preserve license banners (`/*!` and `@license`).

2. **Whitespace Simplification**
  - Collapse repeated blank lines (3+ to 1).
  - Remove spaces around safe punctuation only: `(` `)` `{` `}` `[` `]` `,` `;`.

3. **Dead Code Elimination (owned by minifier)**
  - Fold literal boolean conditions (`if (true/false)`).
  - Fold exact literal comparisons for `<string|number|boolean|undefined> ===|!== <same-domain literal>`.
  - Handle `if` with and without `else`.
  - Handle nested braces using scanner-guided block matching.

### Configuration

```typescript
interface MinifierConfig {
  enabled?: boolean;
  comments?: {
    removeLine?: boolean;
    removeBlock?: boolean;
    preserveLicense?: boolean;
  };
  dce?: {
    enabled?: boolean;
  };
  spacing?: {
    collapseBlankLines?: boolean;
    compactSafePunctuation?: boolean;
  };
}
```

### CLI Usage

```bash
npx ts-node src/core/minifier/cli.ts --input dist/app.js --output dist/app.min.js
```

---

## Out of Scope (V1)

- Identifier/property mangling
- Scope-aware variable renaming
- AST-based optimizations
- Aggressive operator rewrites around `+`, `-`, `/`, `.`
- Cross-module/tree-shaking optimizations

---

## Design & Architecture

### Core Data Structures

```typescript
interface ScanSpan {
  start: number;
  end: number;
  kind: 'code' | 'string' | 'template' | 'line-comment' | 'block-comment' | 'regex';
}

interface ScanResult {
  spans: ScanSpan[];
  ambiguous: boolean;
}
```

### API Signatures

```typescript
class Minifier {
  constructor(config?: MinifierConfig);

  minify(code: string): string;

  private scan(code: string): ScanResult;
  private removeComments(code: string, scan: ScanResult): string;
  private foldStaticIfs(code: string): string;
  private collapseBlankLines(code: string): string;
  private compactSafePunctuation(code: string): string;
}
```

### Implementation Strategy

1. **Scan**: Build lexical spans and ambiguity flags.
2. **Remove Comments Safely**: Respect protected spans and preserve license comments.
3. **Fold Static If Conditions**: DCE for supported literal conditions.
4. **Collapse Blank Lines**: Replace 3+ line breaks with one.
5. **Compact Safe Punctuation**: Remove spaces around safe punctuation set.

### Example: Whitespace Removal

```javascript
// Input
// Calculate team strength
function calcStrength(party) {
  // Sum all levels
  let total = 0;
  for (let i = 0; i < party.length; i++) {
    total += party[i].level;
  }
  return total;
}

// Output
function calcStrength(party){let total=0;for(let i=0;i<party.length;i++){total+=party[i].level}return total}
```

---

## Verification

### Unit Tests
- [ ] Scanner state tracking: strings/templates/comments/regex
- [ ] Whitespace removal: Comments gone, code intact
- [ ] Dead code elimination: static-if folding only
- [ ] Safety guards: no edits in protected spans

### Integration Tests
- [ ] Minify real code (100+ lines): Verify output is valid JavaScript
- [ ] Execute minified code: App still works (functional test)
- [ ] Size reduction: measurable raw/gzip/brotli improvement
- [ ] No mutation in strings/comments/templates

### Performance Targets
- Minify 10KB code: <10ms
- Minify 100KB code: <100ms

---

## TODOs

### Core Implementation
- [ ] Create `Minifier` class with config
- [ ] Implement reusable scanner state machine
- [ ] Implement safe line/block comment removal
- [ ] Implement static condition DCE
- [ ] Implement blank-line collapse
- [ ] Implement safe punctuation compaction

### CLI & Integration
- [ ] Create CLI tool
- [ ] Parse command-line arguments
- [ ] Output minified file

### Testing
- [ ] Unit tests for each operation
- [ ] Integration tests: Minify real app code, verify correctness
- [ ] Performance benchmarks
- [ ] Edge cases: Complex scoping, nested functions, closures

### Documentation
- [ ] API docs for Minifier class
- [ ] Configuration guide
- [ ] Before/after examples
- [ ] Limitations and gotchas

### Optimization (Later)
- [ ] Optional AST-backed optimization mode
- [ ] Identifier/property mangling with full scope analysis
- [ ] More aggressive dead code elimination
- [ ] String compression (replace repeated strings with variables)

---

## Module Files

```
src/core/minifier/
  ├── minifier.ts     # Main Minifier class
  ├── scanner.ts      # Shared lexical scanner helpers
  ├── comments.ts     # Safe comment handling
  ├── dce.ts          # Static-if dead code elimination
  ├── spacing.ts      # Safe whitespace/punctuation compaction
  ├── types.ts        # TypeScript interfaces
  ├── cli.ts          # Command-line interface
  └── index.ts        # Exports
```

