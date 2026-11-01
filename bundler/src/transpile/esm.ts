import type { API } from 'typescript/async';
import type { BundlerTarget } from '../main.ts';
import type { NodeModulesResolver } from '../node-modules-resolver.ts';
import { resolveTscTarget } from './target-resolver.ts';

/** Converts ESM files from outside the source root to CommonJS. */
export class EsmTranspiler {
    private readonly api: API;
    private readonly target: BundlerTarget | undefined;
    private readonly resolver: NodeModulesResolver;
    private compilerOptions: ReturnType<typeof parseOptions> | undefined;

    constructor(
        api: API,
        target: BundlerTarget | undefined,
        resolver: NodeModulesResolver,
    ) {
        this.api = api;
        this.target = target;
        this.resolver = resolver;
    }

    async transpileIfEsm(
        filePath: string,
        code: string,
    ): Promise<string | undefined> {
        if (!(await this.resolver.isEsmFile(filePath))) {
            return undefined;
        }

        this.compilerOptions ??= parseOptions(this.api, this.target);
        const { outputText } = await this.api.transpileModule(code, {
            compilerOptions: await this.compilerOptions,
            // A `.ts` name keeps the file a module even with no import or export.
            fileName: filePath.replace(/\.m?js$/i, '.ts'),
        });
        return outputText;
    }
}

async function parseOptions(api: API, target: BundlerTarget | undefined) {
    const { options } = await api.parseCommandLine([
        '--allowJs',
        '--removeComments',
        '--module',
        'commonjs',
        '--target',
        resolveTscTarget(target),
    ]);
    return options;
}
