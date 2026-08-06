import type {
    AstNode,
    ConditionalNode,
    ProgramNode,
} from '../ast-lite/types.ts';

export function createEnvInjectTransform(
    processEnv: Record<string, string | undefined>,
) {
    return {
        version: `env-injectv3:${JSON.stringify(processEnv)}`,
        moduleTransform: (request: { program: ProgramNode }) => {
            return rewriteProgramEnv(request.program, processEnv);
        },
    };
}

function rewriteProgramEnv(
    program: ProgramNode,
    processEnv: Record<string, string | undefined>,
): ProgramNode {
    return {
        ...program,
        body: rewriteNodesEnv(program.body, processEnv),
    };
}

function rewriteNodesEnv(
    nodes: AstNode[],
    processEnv: Record<string, string | undefined>,
): AstNode[] {
    return nodes.map((node) => rewriteNodeEnv(node, processEnv));
}

function rewriteNodeEnv(
    node: AstNode,
    processEnv: Record<string, string | undefined>,
): AstNode {
    if (node.type === 'blob') {
        return {
            ...node,
            code: replaceProcessEnvReferences(node.code, processEnv),
        };
    }

    if (node.type === 'conditional') {
        return rewriteConditionalEnv(node, processEnv);
    }

    return node;
}

function rewriteConditionalEnv(
    node: ConditionalNode,
    processEnv: Record<string, string | undefined>,
): ConditionalNode {
    return {
        ...node,
        branches: node.branches.map((branch) => ({
            statement: replaceProcessEnvReferences(
                branch.statement,
                processEnv,
            ),
            code: rewriteNodesEnv(branch.code, processEnv),
        })),
        elseCode: node.elseCode
            ? rewriteNodesEnv(node.elseCode, processEnv)
            : null,
    };
}

function replaceProcessEnvReferences(
    code: string,
    processEnv: Record<string, string | undefined>,
): string {
    return code.replace(
        /\bprocess\.env\.([A-Za-z0-9_]+)/g,
        (_match, key: string) => {
            const value = processEnv[key];
            return value === undefined ? 'undefined' : JSON.stringify(value);
        },
    );
}
