import { literal, parse, union } from '@pokedb2/validator';

const modeSchema = union([literal('dev'), literal('production')] as const);

export function parseModeArg(
    argv: string[],
    input?: { required?: boolean },
): 'production' | 'dev' | undefined {
    let value: string | undefined;
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--mode') {
            value = argv[i + 1];
            break;
        }

        if (arg.startsWith('--mode=')) {
            value = arg.slice('--mode='.length);
            break;
        }
    }

    if (!value) {
        if (input?.required) {
            throw new Error(
                '--mode requires a value of "production" or "dev".',
            );
        }
        return undefined;
    }

    return parse(modeSchema, value);
}

export function parseEnvArgs(argv: string[]): Record<string, string> {
    const env: Record<string, string> = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        let pair: string | undefined;

        if (arg === '--env') {
            pair = argv[i + 1];
            i += 1;
        } else if (arg.startsWith('--env=')) {
            pair = arg.slice('--env='.length);
        } else {
            continue;
        }

        if (!pair?.includes('=')) {
            throw new Error(
                '--env requires KEY=VALUE. Example: --env API_URL=https://example.com',
            );
        }

        const separator = pair.indexOf('=');
        const key = pair.slice(0, separator).trim();
        const value = pair.slice(separator + 1);
        if (!key) {
            throw new Error('--env requires a non-empty KEY in KEY=VALUE.');
        }

        env[key] = value;
    }

    return env;
}

export function parseHostArg(argv: string[]): string | undefined {
    return parseStringArg(argv, '--host');
}

export function parsePortArg(argv: string[]): number | undefined {
    const raw = parseStringArg(argv, '--port');
    if (raw === undefined) {
        return undefined;
    }

    const parsed = Number(raw);
    if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
        throw new Error(
            `Invalid --port value: ${raw}. Expected an integer between 0 and 65535.`,
        );
    }

    return parsed;
}

function parseStringArg(argv: string[], name: string): string | undefined {
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === name) {
            return argv[i + 1];
        }
        if (arg.startsWith(`${name}=`)) {
            return arg.slice(name.length + 1);
        }
    }

    return undefined;
}
