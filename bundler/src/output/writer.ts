import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CssDependency } from '../graph/index.ts';

function shortContentHash(contents: string): string {
    return createHash('sha1')
        .update(contents, 'utf8')
        .digest('hex')
        .slice(0, 8);
}

export async function writeMergedCssBundle(
    cssDependencies: CssDependency[],
    outputDirPath: string,
): Promise<string[]> {
    if (cssDependencies.length === 0) {
        return [];
    }

    const mergedCss = cssDependencies
        .map((dependency) => dependency.code)
        .join('\n');
    const fileName = `${shortContentHash(mergedCss)}.css`;
    const outputPath = path.resolve(outputDirPath, fileName);
    await writeFile(outputPath, mergedCss, 'utf8');
    return [outputPath];
}

export async function writeLinkedHtmlFile(input: {
    entryPath: string;
    outputPath: string;
    cssOutputPaths: string[];
}): Promise<string | null> {
    const { readFile, writeFile: write } = await import('node:fs/promises');
    const { pathExists } = await import('../node-modules-resolver.ts');
    const { injectBundledAssetsIntoHtml } = await import('./injector.ts');

    const sourceHtmlPath = path.resolve(
        path.dirname(input.entryPath),
        'index.html',
    );
    if (!(await pathExists(sourceHtmlPath))) {
        return null;
    }

    const sourceHtml = await readFile(sourceHtmlPath, 'utf8');
    const linkedHtml = injectBundledAssetsIntoHtml(sourceHtml, {
        jsFileName: path.basename(input.outputPath),
        cssFileNames: input.cssOutputPaths.map((outputPath) =>
            path.basename(outputPath),
        ),
    });
    const outputHtmlPath = path.resolve(
        path.dirname(input.outputPath),
        'index.html',
    );
    await write(outputHtmlPath, linkedHtml, 'utf8');
    return outputHtmlPath;
}
