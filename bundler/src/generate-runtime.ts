import path from "node:path";
import type { DependencyEntry, DependencyModule } from "./graph/index.ts";
import type { RuntimeOptions } from "./main.ts";

export function generateRuntimeCode(
	modules: DependencyEntry[],
	options: RuntimeOptions,
): string {
	const normalizedEntryPath = path.resolve(options.entryPath);
	const nameGen = createNameGenerator();
	const modulePathSet = new Map(
		modules.map((module) => [module.path, nameGen()]),
	);

	const moduleTableEntries = modules
		.map((module) => {
			const rewrittenCode = rewriteRequires(module, modulePathSet);
			const path = modulePathSet.get(module.path) ?? module.path;
			return `${JSON.stringify(path)}: (module, exports, require) => {\n${rewrittenCode}\n}`;
		})
		.join(",\n");

	return [
		"const m={",
		`${moduleTableEntries}`,
		"};",
		`const c={};const r=id=>{if(c[id]) return c[id].exports;const f=m[id];if(!f){throw new Error(\`Module not found: \${id}\`)};const module={exports:{}};c[id]=module;f(module,module.exports,r);return module.exports;};r(${JSON.stringify(modulePathSet.get(normalizedEntryPath))});`,
	].join("\n");
}

function rewriteRequires(
	module: DependencyEntry,
	modulePathSet: Map<string, string>,
): string {
	if (!("requires" in module)) {
		return module.code;
	}

	const localRequireRegex = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
	const dependencyMap = buildDependencyMap(module);

	return module.code.replace(
		localRequireRegex,
		(fullMatch, specifier: string) => {
			const mappedDependencyPath = dependencyMap[specifier];
			if (mappedDependencyPath) {
				const moduleId = modulePathSet.get(mappedDependencyPath);
				if (moduleId) {
					return `require(${JSON.stringify(moduleId)})`;
				}
			}

			return fullMatch;
		},
	);
}

function buildDependencyMap(module: DependencyModule): Record<string, string> {
	const out: Record<string, string> = {};
	for (const dep of module.requires) {
		out[dep.specifier] = dep.resolvedPath;
	}
	return out;
}

function createNameGenerator(): () => string {
	let counter = 0;
	return () => {
		counter += 1;
		return counter.toString(36);
	};
}
