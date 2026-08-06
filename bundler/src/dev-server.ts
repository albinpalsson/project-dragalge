#!/usr/bin/env node
import { parseEnvArgs, parseHostArg, parsePortArg } from './cli-utils.ts';
import { startDevServer } from './dev-server/index.ts';

const cwd = process.cwd();
const argv = process.argv.slice(2);

const env = parseEnvArgs(argv);
const port = parsePortArg(argv);
const host = parseHostArg(argv);

const configOverrides = {
    mode: 'dev' as 'dev',
    ...(Object.keys(env).length > 0 ? { env } : {}),
};

startDevServer({
    cwd,
    host,
    port,
    configOverrides,
})
    .then(() => {})
    .catch((error) => {
        const message =
            error instanceof Error
                ? (error.stack ?? error.message)
                : String(error);
        process.stderr.write(`${message}\n`);
        process.exitCode = 1;
    });
