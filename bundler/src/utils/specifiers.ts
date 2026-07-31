import path from "node:path";

export function isRelativeSpecifier(specifier: string): boolean {
	return specifier.startsWith("./") || specifier.startsWith("../");
}

export function isCssFilePath(filePath: string): boolean {
	return path.extname(filePath).toLowerCase() === ".css";
}
