import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";

import { AST_LITE_VERSION, type ProgramNode } from "./ast-types.ts";
import { LONGHAND_PRIORITY_PROPERTIES } from "./longhand-properties.ts";
import {
	CSS_IN_JS_METADATA_KEY,
	type CssTransformModuleMetadata,
	cssInJsTransform,
} from "./transform.ts";

function programFrom(code: string): ProgramNode {
	return {
		type: "program",
		version: AST_LITE_VERSION,
		body: [
			{ type: "blob", code: code.slice(0, code.indexOf("`")) },
			{
				type: "protected",
				kind: "template",
				code: code.slice(code.indexOf("`"), code.lastIndexOf("`") + 1),
			},
			{ type: "blob", code: code.slice(code.lastIndexOf("`") + 1) },
		],
	};
}

function toTransformResult(result: unknown): ProgramNode {
	if (
		typeof result === "object" &&
		result !== null &&
		"type" in result &&
		result.type === "program"
	) {
		return result as ProgramNode;
	}

	throw new Error("Expected module-phase transform result.");
}

function findAssignmentCode(output: ProgramNode): string {
	for (let i = 0; i < output.body.length; i++) {
		const node = output.body[i];
		if (node.type === "blob" && node.code.includes("const cls = ")) {
			let assignmentCode = node.code;

			// Include the protected string node that follows
			if (i + 1 < output.body.length) {
				const next = output.body[i + 1];
				if (next.type === "protected" && next.kind === "string") {
					assignmentCode += next.code;
				}
			}

			return assignmentCode;
		}
	}

	throw new Error("Expected transformed assignment blob.");
}

async function runModuleTransform(source: string, filePath: string) {
	const transform = cssInJsTransform();
	const metadata: Record<string, unknown> = {};
	const result = transform.moduleTransform({
		phase: "module",
		path: filePath,
		program: programFrom(source),
		metadata,
	});
	const transformResult = toTransformResult(result);

	return {
		metadata,
		output: transformResult,
	};
}

async function completeCss(
	moduleMetadataByPath: Record<string, Record<string, unknown>>,
): Promise<string> {
	const transform = cssInJsTransform();
	const dependencies: Array<{
		type: "css" | "js";
		path: string;
		code: string;
		metadata?: Record<string, unknown>;
	}> = Object.entries(moduleMetadataByPath).map(([pathName, metadata]) => ({
		type: "js" as const,
		path: pathName,
		code: "",
		metadata: metadata,
	}));

	const result = await transform.postModuleTransform({
		dependencies,
	});

	if (result !== undefined) {
		throw new Error("Expected postModuleTransform to return void.");
	}

	const cssDependency = dependencies.find(
		(dependency) => dependency.type === "css",
	);
	if (!cssDependency) {
		throw new Error("Expected extracted CSS dependency.");
	}

	return cssDependency.code;
}

function getCssMetadata(
	metadata: Record<string, unknown>,
): CssTransformModuleMetadata {
	const value = metadata[CSS_IN_JS_METADATA_KEY];
	if (!value || typeof value !== "object") {
		throw new Error("Expected CSS metadata namespace.");
	}

	return value as CssTransformModuleMetadata;
}

test("transform emits atomic classes for plain declarations", async () => {
	const modulePath = path.resolve("virtual-css/plain.js");
	const { metadata, output } = await runModuleTransform(
		"const cls = css`color: red; margin-top: 8px;`;",
		modulePath,
	);
	const emitted = await completeCss({ [modulePath]: metadata });
	const assignmentCode = findAssignmentCode(output);

	assert.match(assignmentCode, /const cls = "c[a-z0-9_-]{6} c[a-z0-9_-]{6}"/);
	assert.match(emitted, /\.c[a-z0-9_-]{6}\{color:red;\}/);
	assert.match(emitted, /\.c[a-z0-9_-]{6}\.c[a-z0-9_-]{6}\{margin-top:8px;\}/);
});

test("transform emits single advanced class for pseudo selectors and media", async () => {
	const modulePath = path.resolve("virtual-css/advanced.js");
	const { metadata, output } = await runModuleTransform(
		"const cls = css`&:hover { color: pink; } @media (max-width: 400px) { background: orange; }`;",
		modulePath,
	);
	const emitted = await completeCss({ [modulePath]: metadata });
	const assignmentCode = findAssignmentCode(output);

	assert.match(assignmentCode, /const cls = "c[a-z0-9_-]{6} c[a-z0-9_-]{6}"/);
	assert.match(emitted, /\.c[a-z0-9_-]{6}:hover \{ color: pink; \}/);
	assert.match(
		emitted,
		/@media \(max-width: 400px\) \{ \.c[a-z0-9_-]{6} \{ background: orange; \} \}/,
	);
});

test("transform emits atomic declarations plus separate complex unit classes from one template", async () => {
	const modulePath = path.resolve("virtual-css/mixed.js");
	const { metadata, output } = await runModuleTransform(
		"const cls = css`background-color: #007bff; padding: 10px; &:hover { background-color: #0056b3; }`;",
		modulePath,
	);
	const emitted = await completeCss({ [modulePath]: metadata });
	const assignmentCode = findAssignmentCode(output);

	assert.match(
		assignmentCode,
		/const cls = "c[a-z0-9_-]{6} c[a-z0-9_-]{6} c[a-z0-9_-]{6}"/,
	);
	assert.match(emitted, /\.c[a-z0-9_-]{6}\{background-color:#007bff;\}/);
	assert.match(emitted, /\.c[a-z0-9_-]{6}\{padding:10px;\}/);
	assert.match(
		emitted,
		/\.c[a-z0-9_-]{6}:hover \{ background-color: #0056b3; \}/,
	);
});

test("transform expands repeated ampersands", async () => {
	const modulePath = path.resolve("virtual-css/amp.js");
	const { metadata } = await runModuleTransform(
		"const cls = css`&&& { color: #BF4F74; }`;",
		modulePath,
	);
	const emitted = await completeCss({ [modulePath]: metadata });

	assert.match(emitted, /(\.c[a-z0-9_-]{6})\1\1 \{ color: #BF4F74; \}/);
});

test("transform rejects dynamic template values", async () => {
	const transform = cssInJsTransform();
	const input = programFrom("const cls = css`color: ${theme.color};`;");

	await assert.rejects(
		async () =>
			transform.moduleTransform({
				phase: "module",
				path: path.resolve("virtual-css/dynamic.js"),
				program: input,
				metadata: {},
			}),
		/Dynamic css template values are not supported/,
	);
});

test("transform rewrites transpiled tagged template callsites", async () => {
	const modulePath = path.resolve("virtual-css/transpiled.js");
	const { metadata, output } = await runModuleTransform(
		"const cls = (0, css_in_js_1.css)`color: red;`;",
		modulePath,
	);
	const emitted = await completeCss({ [modulePath]: metadata });
	const assignmentCode = findAssignmentCode(output);

	assert.match(assignmentCode, /const cls = "c[a-z0-9_-]{6}"/);
	assert.match(emitted, /\.c[a-z0-9_-]{6}\{color:red;\}/);
});

test("complete phase deduplicates matching atoms across modules", async () => {
	const transform = cssInJsTransform();
	const leftPath = path.resolve("virtual-css/left.js");
	const rightPath = path.resolve("virtual-css/right.js");
	const leftMetadata: Record<string, unknown> = {};
	const rightMetadata: Record<string, unknown> = {};

	transform.moduleTransform({
		phase: "module",
		path: leftPath,
		program: programFrom("const cls = css`color: red; margin-top: 8px;`;"),
		metadata: leftMetadata,
	});
	transform.moduleTransform({
		phase: "module",
		path: rightPath,
		program: programFrom("const cls = css`color: red;`;"),
		metadata: rightMetadata,
	});

	const emitted = await completeCss({
		[leftPath]: leftMetadata,
		[rightPath]: rightMetadata,
	});

	const colorMatches = emitted.match(/color:red;/g) ?? [];
	assert.equal(colorMatches.length, 1);
});

test("longhand snapshot includes expanded set", () => {
	assert.ok(LONGHAND_PRIORITY_PROPERTIES.size > 40);
	assert.ok(LONGHAND_PRIORITY_PROPERTIES.has("padding-left"));
	assert.ok(LONGHAND_PRIORITY_PROPERTIES.has("text-decoration-color"));
});
