import type { BundlerConfig, BundlerMode } from "../main.ts";
import { loadCjsConfig, resolveConfigPath } from "./loader.ts";
import { buildProcessEnv, resolveMode } from "./resolver.ts";

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
		entry: "src/index.ts",
		outputDir: "dist",
		transforms: [],
		cacheDir: ".cache",
		...fileConfig,
		...(configOverrides ?? {}),
	};

	const resolvedMode = resolveMode(mergedConfig.mode, process.env.NODE_ENV);

	return {
		...mergedConfig,
		mode: resolvedMode,
		processEnv: buildProcessEnv(resolvedMode, mergedConfig.env),
	};
}
