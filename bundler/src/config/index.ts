import type { BundlerConfig } from '../main.ts';
import { normalizeInlineAssetExtensions } from '../utils/index.ts';
import { loadCjsConfig, resolveConfigPath } from './loader.ts';
import { buildProcessEnv, resolveMode } from './resolver.ts';

// A lazy chunk smaller than this is not worth its own request.
const DEFAULT_MIN_CHUNK_BYTES = 8 * 1024;

export async function loadResolvedConfig(
    cwd: string,
    configFileName: string | undefined,
    configOverrides?: Partial<BundlerConfig>,
) {
    let fileConfig: Partial<BundlerConfig> = {};
    const configPath = await resolveConfigPath(cwd, configFileName);
    if (configPath) {
        fileConfig = loadCjsConfig(configPath);
    }

    const mergedConfig = {
        entry: 'src/index.ts',
        outputDir: 'dist',
        transforms: [],
        cacheDir: '.cache',
        ...fileConfig,
        ...(configOverrides ?? {}),
    };

    const resolvedMode = resolveMode(mergedConfig.mode, process.env.NODE_ENV);

    return {
        ...mergedConfig,
        // The validated file config carries unset options as explicit `undefined`,
        // which would overwrite a default applied before the merge.
        minChunkBytes: mergedConfig.minChunkBytes ?? DEFAULT_MIN_CHUNK_BYTES,
        inlineAssets: normalizeInlineAssetExtensions(
            mergedConfig.inlineAssets ?? [],
        ),
        mode: resolvedMode,
        processEnv: buildProcessEnv(resolvedMode, mergedConfig.env),
    };
}
