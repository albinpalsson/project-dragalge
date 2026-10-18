import assert from 'node:assert/strict';
import test from 'node:test';

import {
    array,
    boolean,
    isStandardSchema,
    literal,
    object,
    optional,
    parse,
    record,
    safeParse,
    string,
    union,
    ValidationError,
} from './index.ts';

test('exposes a Standard Schema compatible contract', () => {
    const schema = string();
    assert.equal(schema['~standard'].version, 1);
    assert.equal(schema['~standard'].vendor, '@project-dragalge/validator');
    assert.equal(typeof schema['~standard'].validate, 'function');
    assert.equal(isStandardSchema(schema), true);
});

test('parse validates nested object structures', () => {
    const schema = object({
        name: string(),
        tags: array(string()),
        enabled: optional(boolean()),
    });

    const output = parse(schema, {
        name: 'build-tool',
        tags: ['bundler', 'resolver'],
    });

    assert.deepEqual(output, {
        name: 'build-tool',
        tags: ['bundler', 'resolver'],
        enabled: undefined,
    });
});

test('safeParse reports issue paths for nested failures', () => {
    const schema = object({
        tags: array(string()),
    });

    const result = safeParse(schema, {
        tags: ['valid', 42],
    });

    assert.equal(result.success, false);
    if (result.success) {
        return;
    }

    assert.deepEqual(result.issues[0]?.path, ['tags', 1]);
});

test('union supports literal sets', () => {
    const modeSchema = union([literal('dev'), literal('production')] as const);

    assert.equal(parse(modeSchema, 'dev'), 'dev');

    const invalid = safeParse(modeSchema, 'staging');
    assert.equal(invalid.success, false);
});

test('record validates each value', () => {
    const schema = record(array(string()));

    const output = parse(schema, {
        first: ['a', 'b'],
        second: [],
    });

    assert.deepEqual(output, {
        first: ['a', 'b'],
        second: [],
    });
});

test('parse throws ValidationError with readable paths', () => {
    const schema = object({
        config: object({
            mode: literal('production'),
        }),
    });

    assert.throws(
        () => parse(schema, { config: { mode: 'dev' } }),
        (error: unknown) => {
            assert.equal(error instanceof ValidationError, true);
            assert.match((error as Error).message, /config\.mode/);
            return true;
        },
    );
});
