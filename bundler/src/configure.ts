import type { BundlerConfig } from "./main.ts";

/**
 * Type-safe config helper. Create a bundler.config.cjs in your project
 * that exports the config object via module.exports:
 *
 *   // @ts-check
 *   // @type {import('@pokedb2/bundler/configure').BundlerConfig}
 *   module.exports = { entry: 'src/index.ts', outputDir: 'dist', transforms: [] };
 */
export function configure(config: BundlerConfig): BundlerConfig {
	return config;
}
