import { createHash } from "node:crypto";

import {
	AST_LITE_VERSION,
	type AstNode,
	type ConditionalNode,
	type ProgramNode,
} from "./ast-types.ts";
import { LONGHAND_PRIORITY_PROPERTIES } from "./longhand-properties.ts";

export interface TransformModuleRequest {
	phase: "module";
	path: string;
	program: ProgramNode;
	metadata: Record<string, unknown>;
}

export interface CssTransformFullContextRequest {
	dependencies: Array<{
		type: "css" | "js";
		path: string;
		code: string;
		metadata?: Record<string, unknown>;
	}>;
}

export interface CssTransform {
	version: string;
	moduleTransform: (request: TransformModuleRequest) => ProgramNode;
	postModuleTransform: (request: CssTransformFullContextRequest) => void;
}

export interface CssRuleRecord {
	className: string;
	cssText: string;
}

export interface CssTransformModuleMetadata {
	rules: CssRuleRecord[];
}

interface Declaration {
	property: string;
	value: string;
}

interface BlockSegment {
	selector: string;
	body: string;
}

interface MediaSegment {
	query: string;
	body: string;
}

interface ParsedTemplate {
	declarations: Declaration[];
	blocks: BlockSegment[];
	media: MediaSegment[];
}

export const CSS_IN_JS_METADATA_KEY = "@pokedb2/css-in-js";

export function cssInJsTransform(): CssTransform {
	return {
		version: "css-in-js:v2",
		moduleTransform: (request: TransformModuleRequest) => {
			assertProgramVersion(request.program);

			const ruleByClassName = new Map<string, string>();
			rewriteBody(request.program.body, ruleByClassName);

			if (ruleByClassName.size > 0) {
				request.metadata[CSS_IN_JS_METADATA_KEY] = {
					rules: Array.from(ruleByClassName.entries()).map(
						([className, cssText]) => ({ className, cssText }),
					),
				} satisfies CssTransformModuleMetadata;
			}

			return request.program;
		},
		postModuleTransform: (request: CssTransformFullContextRequest): void => {
			const ruleByClassName = new Map<string, string>();

			for (const dependency of request.dependencies) {
				const rawMetadata = dependency.metadata?.[CSS_IN_JS_METADATA_KEY] as
					| CssTransformModuleMetadata
					| undefined;
				if (rawMetadata) {
					for (const rule of rawMetadata.rules) {
						ruleByClassName.set(rule.className, rule.cssText);
					}
				}
			}

			if (ruleByClassName.size === 0) {
				return;
			}

			request.dependencies.push({
				type: "css",
				path: "extracted-atomic.css",
				code: Array.from(ruleByClassName.values()).join("\n"),
			});
		},
	};
}

function assertProgramVersion(program: ProgramNode): void {
	if (program.version !== AST_LITE_VERSION) {
		throw new Error(
			`Unsupported AST-lite version: ${String(program.version)}. Expected ${AST_LITE_VERSION}.`,
		);
	}
}

function rewriteBody(nodes: AstNode[], ruleByClassName: Map<string, string>) {
	for (let i = 0; i < nodes.length; i += 1) {
		const current = nodes[i];

		if (current.type === "conditional") {
			rewriteConditionalNode(current, ruleByClassName);
		} else {
			tryRewriteTemplateAt(nodes, i, ruleByClassName);
		}
	}
}

function rewriteConditionalNode(
	node: ConditionalNode,
	ruleByClassName: Map<string, string>,
) {
	for (const branch of node.branches) {
		rewriteBody(branch.code, ruleByClassName);
	}
	if (node.elseCode) {
		rewriteBody(node.elseCode, ruleByClassName);
	}
}

function tryRewriteTemplateAt(
	nodes: AstNode[],
	i: number,
	ruleByClassName: Map<string, string>,
): boolean {
	const current = nodes[i];
	if (current.type !== "blob") {
		return false;
	}

	const next = nodes[i + 1];
	if (!next || next.type !== "protected" || next.kind !== "template") {
		return false;
	}

	const found = eraseCssPrefix(current);
	if (!found) {
		return false;
	}

	const template = stripTemplateDelimiters(next.code);
	if (template.includes("${")) {
		throw new Error("Dynamic css template values are not supported.");
	}

	// Reuse the template node as the output string literal.
	next.kind = "string";
	next.code = JSON.stringify(emitCss(template, ruleByClassName));
	return true;
}

function eraseCssPrefix(node: { code: string }): boolean {
	const matchers = [
		/\bcss\s*$/,
		/[A-Za-z_$][\w$]*\.css\s*$/,
		/\(\s*0\s*,\s*[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)*\.css\s*\)\s*$/,
	];

	for (const matcher of matchers) {
		if (matcher.test(node.code)) {
			node.code = node.code.replace(matcher, "");
			return true;
		}
	}

	return false;
}

function emitCss(
	template: string,
	ruleByClassName: Map<string, string>,
): string {
	const parsed = parseTemplateCss(template);
	const classes: string[] = [];

	for (const decl of parsed.declarations) {
		const property = `${decl.property}:${decl.value}`;
		const className = createClassname(property);
		const selector = LONGHAND_PRIORITY_PROPERTIES.has(decl.property)
			? `.${className}.${className}`
			: `.${className}`;
		const cssText = `${selector}{${property};}`;
		ruleByClassName.set(className, cssText);
		classes.push(className);
	}

	for (const block of parsed.blocks) {
		const className = createClassname(
			`block|${block.selector}|${normalizeWhitespace(block.body)}`,
		);
		ruleByClassName.set(className, buildBlockUnitCss(className, block));
		classes.push(className);
	}

	for (const media of parsed.media) {
		const className = createClassname(
			`media|${media.query}|${normalizeWhitespace(media.body)}`,
		);
		ruleByClassName.set(className, buildMediaUnitCss(className, media));
		classes.push(className);
	}

	return classes.join(" ");
}

function buildBlockUnitCss(className: string, block: BlockSegment): string {
	const selector = `.${className}`;
	const expandedSelector = block.selector.includes("&")
		? block.selector.replaceAll("&", selector)
		: `${selector} ${block.selector}`;
	return `${expandedSelector} { ${normalizeWhitespace(block.body)} }`;
}

function buildMediaUnitCss(className: string, media: MediaSegment): string {
	const selector = `.${className}`;
	const inner = parseDeclarations(media.body)
		.map((decl) => `${decl.property}: ${decl.value};`)
		.join(" ");
	return `@media ${media.query} { ${selector} { ${inner} } }`;
}

function createClassname(key: string): string {
	const hash = createHash("sha1")
		.update(key, "utf8")
		.digest("base64url")
		.slice(0, 6)
		.toLowerCase();
	return `c${hash}`;
}

function parseTemplateCss(input: string): ParsedTemplate {
	const css = normalizeWhitespace(input).trim();
	const declarations: Declaration[] = [];
	const blocks: BlockSegment[] = [];
	const media: MediaSegment[] = [];

	let cursor = 0;
	while (cursor < css.length) {
		cursor = skipWhitespace(css, cursor);
		if (cursor >= css.length) {
			break;
		}

		const openBrace = css.indexOf("{", cursor);
		const semicolon = css.indexOf(";", cursor);

		if (openBrace !== -1 && (semicolon === -1 || openBrace < semicolon)) {
			const header = css.slice(cursor, openBrace).trim();
			const close = findMatchingBrace(css, openBrace);
			const body = css.slice(openBrace + 1, close).trim();

			if (header.startsWith("@media")) {
				media.push({ query: header.slice("@media".length).trim(), body });
			} else {
				blocks.push({ selector: header, body });
			}

			cursor = close + 1;
			continue;
		}

		const declarationEnd = semicolon === -1 ? css.length : semicolon;
		const declaration = css.slice(cursor, declarationEnd).trim();
		if (declaration.length > 0) {
			const split = declaration.indexOf(":");
			if (split === -1) {
				throw new Error(`Invalid CSS declaration: ${declaration}`);
			}

			declarations.push({
				property: declaration.slice(0, split).trim().toLowerCase(),
				value: declaration.slice(split + 1).trim(),
			});
		}

		cursor = declarationEnd + 1;
	}

	return { declarations, blocks, media };
}

function parseDeclarations(input: string): Declaration[] {
	return normalizeWhitespace(input)
		.split(";")
		.map((item) => item.trim())
		.filter(Boolean)
		.map((item) => {
			const split = item.indexOf(":");
			if (split === -1) {
				throw new Error(`Invalid CSS declaration: ${item}`);
			}
			return {
				property: item.slice(0, split).trim().toLowerCase(),
				value: item.slice(split + 1).trim(),
			};
		});
}

function stripTemplateDelimiters(templateCode: string): string {
	if (
		templateCode.length < 2 ||
		templateCode[0] !== "`" ||
		templateCode[templateCode.length - 1] !== "`"
	) {
		return templateCode;
	}

	return templateCode.slice(1, -1);
}

function normalizeWhitespace(value: string): string {
	return value.replace(/\s+/g, " ").trim();
}

function skipWhitespace(input: string, start: number): number {
	let cursor = start;
	while (cursor < input.length && /\s/.test(input[cursor])) {
		cursor += 1;
	}
	return cursor;
}

function findMatchingBrace(input: string, openIndex: number): number {
	let depth = 0;
	for (let i = openIndex; i < input.length; i += 1) {
		const ch = input[i];
		if (ch === "{") {
			depth += 1;
		} else if (ch === "}") {
			depth -= 1;
			if (depth === 0) {
				return i;
			}
		}
	}

	throw new Error("Unbalanced CSS block braces.");
}
