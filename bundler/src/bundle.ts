#!/usr/bin/env node
import {
  parseEnvArgs,
  parseModeArg,
} from './cli-utils.ts';
import { main } from './main.ts';

const cwd = process.cwd();
const mode = parseModeArg(process.argv.slice(2), { required: true });
const env = parseEnvArgs(process.argv.slice(2));
const configOverrides = {
  ...(mode ? { mode } : {}),
  ...(Object.keys(env).length > 0 ? { env } : {}),
};

main({ cwd, configOverrides }).then(() => {
}).catch((error) => {
  const message = error instanceof Error ? error.stack ?? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
