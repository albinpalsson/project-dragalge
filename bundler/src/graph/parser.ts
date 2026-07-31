import type { AstNode } from '../ast-lite/';
import type { ParsedDependency } from './types';

const requireRegex = /require\(\s*$/;

export function findDependencies(code: AstNode[]): ParsedDependency[] {
  const found: ParsedDependency[] = [];
  for (let i = 0; i < code.length; i++) {
    const node = code[i];
    if (node.type === 'blob') {
      if (requireRegex.test(node.code)) {
        const next = code[i + 1];
        if (next.type === 'protected' && next.kind === 'string') {
          found.push({ type: 'require', specifier: unquoteDependencySpecifier(next.code) });
        }
      }
    }
    if (node.type === 'conditional') {
      for (const branch of node.branches) {
        found.push(...findDependencies(branch.code));
      }
      found.push(...findDependencies(node.elseCode ?? []));
    }
  }
  return found;
}

export function unquoteDependencySpecifier(value: string): string {
  if (value.length < 2) {
    return value;
  }

  const first = value[0];
  const last = value[value.length - 1];
  if ((first === '\'' && last === '\'') || (first === '"' && last === '"')) {
    return value.slice(1, -1);
  }

  console.warn(`Dependency specifier is not quoted: ${value}`);
  return value;
}
