import { readFile, writeFile } from 'node:fs/promises';
import { brotliCompress, constants as zlibConstants } from 'node:zlib';
import { promisify } from 'node:util';
import type { BundlerMode } from '../main';

const brotliCompressAsync = promisify(brotliCompress);

export async function writeBrotliFile(filePath: string): Promise<string> {
  const source = await readFile(filePath);
  const compressed = await brotliCompressAsync(source, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: zlibConstants.BROTLI_MAX_QUALITY,
    },
  });
  const outputPath = `${filePath}.br`;
  await writeFile(outputPath, compressed);
  return outputPath;
}

export async function compressOutputFiles(input: {
  outputPath: string;
  cssOutputPaths: string[];
  mode: BundlerMode;
}): Promise<string[]> {
  if (input.mode !== 'production') {
    return [];
  }

  const outputPaths = [input.outputPath, ...input.cssOutputPaths];
  const compressedPaths = await Promise.all(outputPaths.map((filePath) => writeBrotliFile(filePath)));
  return compressedPaths;
}
