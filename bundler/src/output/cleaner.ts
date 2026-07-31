import type { CssDependency } from "../graph/index.ts";

export interface PublicAssetCopyResult {
	sourceDirPath: string;
}

export async function cleanOutputDir(outputDirPath: string): Promise<void> {
	const { mkdir, rm } = await import("node:fs/promises");
	await rm(outputDirPath, { recursive: true, force: true });
	await mkdir(outputDirPath, { recursive: true });
}

export function clearCssDependencyRuntimeSource(
	cssDependencies: CssDependency[],
): void {
	for (const dependency of cssDependencies) {
		dependency.code = "";
	}
}
