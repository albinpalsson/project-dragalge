import path from 'node:path';
import { parse } from '@pokedb2/validator';
import type { BundlerConfig } from '../main.ts';
import { pathExists } from '../node-modules-resolver.ts';
import { bundlerConfigSchema } from './schema.ts';

const DEFAULT_CONFIG_FILE_NAME = 'bundler.config.cjs';

export async function resolveConfigPath(
    cwd: string,
    configFileName: string | undefined,
): Promise<string | null> {
    const requestedFileName = configFileName ?? DEFAULT_CONFIG_FILE_NAME;
    if (path.extname(requestedFileName).toLowerCase() !== '.cjs') {
        throw new Error(
            `Unsupported config file "${requestedFileName}". Only .cjs config files are supported.`,
        );
    }

    const candidatePath = path.resolve(cwd, requestedFileName);
    if (await pathExists(candidatePath)) {
        return candidatePath;
    }

    return null;
}

export function loadCjsConfig(configPath: string): Partial<BundlerConfig> {
    const cjsRequire = require as NodeJS.Require;
    const resolvedConfigPath = cjsRequire.resolve(configPath);
    delete cjsRequire.cache[resolvedConfigPath];

    const loaded = cjsRequire(resolvedConfigPath) as unknown;
    const raw =
        loaded &&
        typeof loaded === 'object' &&
        'default' in (loaded as Record<string, unknown>)
            ? (loaded as { default: unknown }).default
            : loaded;

    const config = parse(bundlerConfigSchema, raw);
    return config as Partial<BundlerConfig>;
}
