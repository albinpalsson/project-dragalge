export const SCANNER_VERSION = 'v1';

export interface Range {
  start: number;
  end: number;
}

export interface CommentRange extends Range {
  kind: 'line' | 'block';
  text: string;
}

export interface SpanRange extends Range {
  kind: 'string' | 'template' | 'comment' | 'regex';
}

export interface ScanResult {
  code: string;
  spans: SpanRange[];
  protectedRanges: Range[];
  comments: CommentRange[];
  ambiguous: boolean;
}

type ScannerState = 'code' | 'single' | 'double' | 'template' | 'line-comment' | 'block-comment' | 'regex';

export function scanJavaScript(code: string): ScanResult {
  const protectedRanges: Range[] = [];
  const spans: SpanRange[] = [];
  const comments: CommentRange[] = [];
  let ambiguous = false;

  let state: ScannerState = 'code';
  let stateStart = 0;
  let stateKind: SpanRange['kind'] | undefined;
  let i = 0;
  let prevSignificant = '';
  let inRegexCharClass = false;

  const closeProtected = (end: number) => {
    if (stateStart < end) {
      protectedRanges.push({ start: stateStart, end });
      if (stateKind) {
        spans.push({ start: stateStart, end, kind: stateKind });
      }
    }
  };

  while (i < code.length) {
    const ch = code[i];
    const next = i + 1 < code.length ? code[i + 1] : '';

    if (state === 'code') {
      if (ch === '/' && next === '/') {
        state = 'line-comment';
        stateStart = i;
        stateKind = 'comment';
        i += 2;
        continue;
      }

      if (ch === '/' && next === '*') {
        state = 'block-comment';
        stateStart = i;
        stateKind = 'comment';
        i += 2;
        continue;
      }

      if (ch === '\'') {
        state = 'single';
        stateStart = i;
        stateKind = 'string';
        i += 1;
        continue;
      }

      if (ch === '"') {
        state = 'double';
        stateStart = i;
        stateKind = 'string';
        i += 1;
        continue;
      }

      if (ch === '`') {
        state = 'template';
        stateStart = i;
        stateKind = 'template';
        i += 1;
        continue;
      }

      if (ch === '/') {
        if (isLikelyRegexStart(prevSignificant)) {
          state = 'regex';
          stateStart = i;
          stateKind = 'regex';
          inRegexCharClass = false;
          i += 1;
          continue;
        }
      }

      if (!isWhitespace(ch)) {
        prevSignificant = ch;
      }
      i += 1;
      continue;
    }

    if (state === 'single') {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '\'') {
        i += 1;
        closeProtected(i);
        state = 'code';
        prevSignificant = 'x';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'double') {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '"') {
        i += 1;
        closeProtected(i);
        state = 'code';
        prevSignificant = 'x';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'template') {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '`') {
        i += 1;
        closeProtected(i);
        state = 'code';
        prevSignificant = 'x';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'regex') {
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === '[') {
        inRegexCharClass = true;
        i += 1;
        continue;
      }
      if (ch === ']') {
        inRegexCharClass = false;
        i += 1;
        continue;
      }
      if (ch === '/' && !inRegexCharClass) {
        i += 1;
        while (i < code.length && /[a-z]/i.test(code[i])) {
          i += 1;
        }
        closeProtected(i);
        state = 'code';
        prevSignificant = 'x';
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'line-comment') {
      if (ch === '\n') {
        const end = i;
        comments.push({
          kind: 'line',
          start: stateStart,
          end,
          text: code.slice(stateStart, end),
        });
        protectedRanges.push({ start: stateStart, end });
        spans.push({ start: stateStart, end, kind: 'comment' });
        state = 'code';
        stateKind = undefined;
        prevSignificant = '';
        i += 1;
        continue;
      }
      i += 1;
      continue;
    }

    if (state === 'block-comment') {
      if (ch === '*' && next === '/') {
        i += 2;
        const end = i;
        comments.push({
          kind: 'block',
          start: stateStart,
          end,
          text: code.slice(stateStart, end),
        });
        protectedRanges.push({ start: stateStart, end });
        spans.push({ start: stateStart, end, kind: 'comment' });
        state = 'code';
        stateKind = undefined;
        prevSignificant = '';
        continue;
      }
      i += 1;
      continue;
    }
  }

  if (state === 'line-comment') {
    comments.push({
      kind: 'line',
      start: stateStart,
      end: code.length,
      text: code.slice(stateStart),
    });
    protectedRanges.push({ start: stateStart, end: code.length });
    spans.push({ start: stateStart, end: code.length, kind: 'comment' });
  } else if (state === 'block-comment') {
    ambiguous = true;
    protectedRanges.push({ start: stateStart, end: code.length });
    if (stateKind) {
      spans.push({ start: stateStart, end: code.length, kind: stateKind });
    }
  } else if (state !== 'code') {
    ambiguous = true;
    protectedRanges.push({ start: stateStart, end: code.length });
    if (stateKind) {
      spans.push({ start: stateStart, end: code.length, kind: stateKind });
    }
  }

  protectedRanges.sort((a, b) => a.start - b.start);
  spans.sort((a, b) => a.start - b.start);

  return {
    code,
    spans,
    protectedRanges,
    comments,
    ambiguous,
  };
}

export function isIndexProtected(scan: ScanResult, index: number): boolean {
  for (const range of scan.protectedRanges) {
    if (index < range.start) return false;
    if (index >= range.start && index < range.end) return true;
  }
  return false;
}

export function isIndexProtectedBySpans(spans: SpanRange[], index: number): boolean {
  for (const span of spans) {
    if (index < span.start) return false;
    if (index >= span.start && index < span.end) return true;
  }
  return false;
}

function isLikelyRegexStart(prevSignificant: string): boolean {
  if (!prevSignificant) return true;
  return '([{:;,=!&|?+-*%^~<>'.includes(prevSignificant);
}

function isWhitespace(ch: string): boolean {
  return ch === ' ' || ch === '\t' || ch === '\r' || ch === '\n';
}
