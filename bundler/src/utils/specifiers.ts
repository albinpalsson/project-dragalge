export function isRelativeSpecifier(specifier: string): boolean {
  return specifier.startsWith('./') || specifier.startsWith('../');
}

export function isCssFilePath(filePath: string): boolean {
  const path = require('node:path');
  return path.extname(filePath).toLowerCase() === '.css';
}
