import type { AstNode, ConditionalNode, ProgramNode } from './types.ts';

export const AST_LITE_WRITER_VERSION = 'v2';

export function writeProgram(program: ProgramNode): string {
  return program.body.map(writeNode).join('');
}

export function writeNode(node: AstNode): string {
  switch (node.type) {
    case 'comment':
      return node.text;
    case 'blankline':
      return '\n'.repeat(Math.max(1, node.count));
    case 'blob':
      return node.code;
    case 'protected':
      return node.code;
    case 'conditional':
      return writeConditional(node);
    default:
      return '';
  }
}

function writeConditional(node: ConditionalNode): string {
  if (node.branches.length === 0) {
    return node.elseCode ? writeNodes(node.elseCode) : '';
  }

  let output = '';

  for (let i = 0; i < node.branches.length; i += 1) {
    const branch = node.branches[i];
    if (i === 0) {
      output += `if (${branch.statement}) {${writeNodes(branch.code)}}`;
    } else {
      output += ` else if (${branch.statement}) {${writeNodes(branch.code)}}`;
    }
  }

  if (node.elseCode) {
    output += ` else {${writeNodes(node.elseCode)}}`;
  }

  return output;
}

function writeNodes(nodes: AstNode[]): string {
  return nodes.map(writeNode).join('');
}
