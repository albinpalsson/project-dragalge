import { spawn } from 'node:child_process';
import path from 'node:path';
import type { BundlerTarget, BundlerMode } from '../main';
import { resolveTscTarget, resolveTscLib } from './target-resolver';

export function buildTranspileArgs(input: {
  entryPath: string;
  mode: BundlerMode;
  outDir: string;
  target: BundlerTarget | undefined;
}): string[] {
  const compileArgs = [
    '--rootDir', path.dirname(input.entryPath),
    '--outDir', input.outDir,
    '--module', 'commonjs',
    '--moduleResolution', 'bundler',
    '--target', resolveTscTarget(input.target),
    '--lib', resolveTscLib(input.target),
    '--noEmit', 'false',
    '--incremental',
    '--tsBuildInfoFile', path.join(input.outDir, 'tsbuildinfo'),
  ];

  if (input.mode === 'dev') {
    compileArgs.push('--noCheck');
  }

  return compileArgs;
}

export async function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<{ stdout: string; stderr: string }> {
  const [resolvedCommand, resolvedArgs] = process.platform === 'win32'
    ? ['cmd.exe', ['/d', '/s', '/c', command, ...args]]
    : [command, args];

  return new Promise((resolve, reject) => {
    const child = spawn(resolvedCommand, resolvedArgs, {
      cwd,
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
    });

    const chunks: Buffer[] = [];
    child.stdout!.on('data', (chunk: Buffer) => chunks.push(chunk));

    const chunksErr: Buffer[] = [];
    child.stderr!.on('data', (chunk: Buffer) => {
      chunksErr.push(chunk);
    });

    child.once('error', (error: Error) => {
      reject(new Error(`Failed to start transpilation command "${command}": ${error.message}`));
    });

    child.once('close', (code: number | null) => {
      const stdout = Buffer.concat(chunks).toString('utf8');
      const stderr = Buffer.concat(chunksErr).toString('utf8');
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      reject(new Error(`Transpilation command failed with exit code ${code}: ${command} ${args.join(' ')}. Stderr: ${stderr}\nStdout: ${stdout}`));
    });
  });
}
