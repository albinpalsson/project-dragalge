export const AST_LITE_VERSION = "ast-lite-v1";

export interface ProgramNode {
	type: "program";
	version: typeof AST_LITE_VERSION;
	body: AstNode[];
}

export interface CommentNode {
	type: "comment";
	kind: "line" | "block";
	text: string;
}

export interface BlankLineNode {
	type: "blankline";
	count: number;
}

export interface ConditionalBranch {
	statement: string;
	code: AstNode[];
}

export interface ConditionalNode {
	type: "conditional";
	branches: ConditionalBranch[];
	elseCode: AstNode[] | null;
}

export interface BlobNode {
	type: "blob";
	code: string;
}

export interface ProtectedNode {
	type: "protected";
	kind: "string" | "template" | "regex";
	code: string;
}

export type AstNode =
	| CommentNode
	| BlankLineNode
	| ConditionalNode
	| BlobNode
	| ProtectedNode;
