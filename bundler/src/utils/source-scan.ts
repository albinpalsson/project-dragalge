export function extractAdditionalImports(sourceCode: string): string[] {
  const regex = /^import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/gm;
  const fileEndings = ['.css'];
  return [...sourceCode.matchAll(regex)]
    .map((match) => match[1])
    .filter((specifier) => fileEndings.some((ending) => specifier.endsWith(ending)));
}
