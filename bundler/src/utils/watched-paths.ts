import { readdir } from "node:fs/promises";
import path from "node:path";
import type { DependencyEntry } from "../graph/types.ts";
import { pathExists } from "../node-modules-resolver.ts";

export async function buildWatchedFilePaths(
	entryPath: string,
	dependencyEntries: DependencyEntry[],
	publicDirPath: string,
): Promise<string[]> {
	const sourceHtmlPath = path.resolve(path.dirname(entryPath), "index.html");
	const publicWatchPaths = await collectWatchPathsForPublicDir(publicDirPath);
	return [
		...dependencyEntries.map((entry) => entry.path),
		sourceHtmlPath,
		...publicWatchPaths,
	];
}

export async function collectWatchPathsForPublicDir(
	publicDirPath: string,
): Promise<string[]> {
	if (!(await pathExists(publicDirPath))) {
		return [];
	}

	const watchPaths: string[] = [publicDirPath];
	const pendingDirs: string[] = [publicDirPath];

	while (pendingDirs.length > 0) {
		const currentDir = pendingDirs.pop();
		if (!currentDir) {
			continue;
		}
		const entries = await readdir(currentDir, { withFileTypes: true });
		for (const entry of entries) {
			const absolutePath = path.resolve(currentDir, entry.name);
			watchPaths.push(absolutePath);
			if (entry.isDirectory()) {
				pendingDirs.push(absolutePath);
			}
		}
	}

	return watchPaths;
}
