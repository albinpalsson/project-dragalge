import type {
	AstNode,
	BlobNode,
	CommentNode,
	ConditionalNode,
	ProgramNode,
} from "../ast-lite/types.ts";

export function createMinifierTransform() {
	return {
		version: `minifier:v3`,
		moduleTransform: (request: { program: ProgramNode }) => {
			return minifyProgram(request.program);
		},
	};
}

function minifyProgram(program: ProgramNode): ProgramNode {
	return {
		...program,
		body: minifyNodes(program.body),
	};
}

function minifyNodes(nodes: AstNode[]): AstNode[] {
	const output: AstNode[] = [];

	for (const node of nodes) {
		if (node.type === "comment") {
			if (shouldPreserveComment(node)) {
				output.push(node);
			}
			continue;
		}

		if (node.type === "blankline") {
			output.push({
				...node,
				count: 1,
			});
			continue;
		}

		if (node.type === "blob") {
			output.push(minifyBlobNode(node));
			continue;
		}

		if (node.type === "protected") {
			output.push(node);
			continue;
		}

		output.push(...minifyConditionalNode(node));
	}

	return mergeBlankLines(output);
}

function minifyConditionalNode(node: ConditionalNode): AstNode[] {
	const rewritten: ConditionalNode = {
		...node,
		branches: node.branches.map((branch) => ({
			statement: branch.statement.trim(),
			code: minifyNodes(branch.code),
		})),
		elseCode: node.elseCode ? minifyNodes(node.elseCode) : null,
	};

	const folded = evaluateConditionalNode(rewritten);
	if (folded) {
		return minifyNodes(folded);
	}

	return [rewritten];
}

function evaluateConditionalNode(node: ConditionalNode): AstNode[] | undefined {
	for (const branch of node.branches) {
		const result = evaluateStaticCondition(branch.statement);
		if (result === true) {
			return branch.code;
		}
		if (result === undefined) {
			return undefined;
		}
	}

	return node.elseCode ?? [];
}

function shouldPreserveComment(node: CommentNode): boolean {
	return (
		node.kind === "block" &&
		(node.text.startsWith("/*!") || node.text.includes("@license"))
	);
}

function minifyBlobNode(node: BlobNode): BlobNode {
	// trimStart only â€” trailing whitespace must be preserved so that a blob
	// ending with a keyword (e.g. "else ") does not concatenate with the next
	// node (e.g. a conditional written as "if (...)") to form "elseif".
	const compacted = compactPunctuationSpacing(node.code).trimStart();
	return {
		...node,
		code: compacted,
	};
}

function evaluateStaticCondition(expression: string): boolean | undefined {
	const trimmed = expression.trim();
	if (trimmed === "true") return true;
	if (trimmed === "false") return false;

	const comparison = parseComparison(trimmed);
	if (!comparison) {
		return undefined;
	}

	const left = parseLiteral(comparison.left);
	const right = parseLiteral(comparison.right);
	if (left === undefined || right === undefined) {
		return undefined;
	}

	return comparison.operator === "===" ? left === right : left !== right;
}

function parseComparison(
	expression: string,
): { left: string; operator: "===" | "!=="; right: string } | undefined {
	const notEqualIndex = expression.indexOf("!==");
	if (notEqualIndex >= 0) {
		return {
			left: expression.slice(0, notEqualIndex).trim(),
			operator: "!==",
			right: expression.slice(notEqualIndex + 3).trim(),
		};
	}

	const equalIndex = expression.indexOf("===");
	if (equalIndex >= 0) {
		return {
			left: expression.slice(0, equalIndex).trim(),
			operator: "===",
			right: expression.slice(equalIndex + 3).trim(),
		};
	}

	return undefined;
}

function parseLiteral(token: string): string | number | boolean | undefined {
	if (token === "undefined") return undefined;
	if (token === "true") return true;
	if (token === "false") return false;

	if (
		(token.startsWith('"') && token.endsWith('"')) ||
		(token.startsWith("'") && token.endsWith("'"))
	) {
		return token.slice(1, -1);
	}

	if (/^-?\d+(?:\.\d+)?$/.test(token)) {
		return Number(token);
	}

	return undefined;
}

function compactPunctuationSpacing(code: string): string {
	const edits: Array<{ start: number; end: number; value: string }> = [];
	let i = 0;

	while (i < code.length) {
		const ch = code[i];
		if (!"(){}[],;".includes(ch)) {
			i += 1;
			continue;
		}

		let left = i;
		const previousEditEnd = edits.at(-1)?.end ?? 0;
		while (
			left > 0 &&
			left - 1 > previousEditEnd &&
			isRemovableWhitespace(code[left - 1])
		) {
			left -= 1;
		}

		let right = i + 1;
		while (right < code.length && isRemovableWhitespace(code[right])) {
			right += 1;
		}

		if (left !== i || right !== i + 1) {
			edits.push({
				start: left,
				end: right,
				value: ch,
			});
		}

		i += 1;
	}

	return applyEdits(code, edits);
}

function isRemovableWhitespace(ch: string): boolean {
	return ch === " " || ch === "\t" || ch === "\r" || ch === "\n";
}

function mergeBlankLines(nodes: AstNode[]): AstNode[] {
	const merged: AstNode[] = [];

	for (const node of nodes) {
		const previous = merged.at(-1);
		if (node.type === "blankline" && previous && endsWithSemicolon(previous)) {
			continue;
		}

		if (node.type === "blankline" && previous?.type === "blankline") {
			previous.count = Math.min(previous.count + node.count, 1);
			continue;
		}

		merged.push(node);
	}

	return merged;
}

function endsWithSemicolon(node: AstNode): boolean {
	if (node.type === "blob") {
		return node.code.trimEnd().endsWith(";");
	}

	if (node.type === "comment" || node.type === "blankline") {
		return false;
	}

	// Serialized conditionals end with '}', not ';'.
	return false;
}

function applyEdits(
	code: string,
	edits: Array<{ start: number; end: number; value: string }>,
): string {
	if (edits.length === 0) {
		return code;
	}

	let cursor = 0;
	let result = "";
	for (const edit of edits) {
		if (edit.start < cursor) continue;
		result += code.slice(cursor, edit.start);
		result += edit.value;
		cursor = edit.end;
	}
	result += code.slice(cursor);
	return result;
}
