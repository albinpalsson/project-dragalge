import {
    array,
    func,
    literal,
    object,
    optional,
    record,
    string,
    union,
} from '@project-dragalge/validator';

export const transformSchema = object({
    version: string(),
    moduleTransform: optional(func()),
    postModuleTransform: optional(func()),
});

export const bundlerConfigSchema = object({
    entry: optional(string()),
    outputDir: optional(string()),
    mode: optional(union([literal('production'), literal('dev')] as const)),
    target: optional(union([literal('es6'), literal('es2022')] as const)),
    env: optional(record(optional(string()))),
    cacheDir: optional(string()),
    transforms: optional(array(transformSchema)),
});
