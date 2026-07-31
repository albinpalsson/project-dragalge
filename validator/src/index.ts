import type { InferOutput, StandardIssue, StandardPathSegment, StandardResult, StandardSchema } from './standard-schema';

export type { StandardPathSegment, StandardIssue, StandardResult, StandardSchema, InferOutput } from './standard-schema';

export class ValidationError extends Error {
  readonly issues: StandardIssue[];

  constructor(issues: StandardIssue[]) {
    super(formatIssues(issues));
    this.name = 'ValidationError';
    this.issues = issues;
  }
}

function formatIssues(issues: StandardIssue[]): string {
  return issues
    .map((issue) => {
      const path = issue.path.length === 0 ? '<root>' : issue.path.join('.');
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}

function fail<T>(issues: StandardIssue[]): StandardResult<T> {
  return { issues };
}

function ok<T>(value: T): StandardResult<T> {
  return { value };
}

function isFailure<T>(result: StandardResult<T>): result is { issues: StandardIssue[] } {
  return 'issues' in result;
}

function issue(message: string, expected?: string, received?: string): StandardIssue {
  return {
    message,
    path: [],
    expected,
    received,
  };
}

function withPath(pathSegment: StandardPathSegment, issues: StandardIssue[]): StandardIssue[] {
  return issues.map((item) => ({
    ...item,
    path: [pathSegment, ...item.path],
  }));
}

function createSchema<TOutput>(validate: (value: unknown) => StandardResult<TOutput>): StandardSchema<unknown, TOutput> {
  return {
    '~standard': {
      version: 1,
      vendor: '@pokedb2/validator',
      validate,
    },
  };
}

export function isStandardSchema(value: unknown): value is StandardSchema<any, any> {
  return typeof value === 'object'
    && value !== null
    && '~standard' in value
    && typeof (value as { '~standard'?: { validate?: unknown } })['~standard']?.validate === 'function';
}

export function safeParse<TSchema extends StandardSchema<any, any>>(
  schema: TSchema,
  value: unknown,
):
  | { success: true; data: InferOutput<TSchema> }
  | { success: false; issues: StandardIssue[] } {
  const result = schema['~standard'].validate(value);
  if (isFailure(result)) {
    return {
      success: false,
      issues: result.issues,
    };
  }

  return {
    success: true,
    data: result.value as InferOutput<TSchema>,
  };
}

export function parse<TSchema extends StandardSchema<any, any>>(
  schema: TSchema,
  value: unknown,
): InferOutput<TSchema> {
  const result = safeParse(schema, value);
  if (!result.success) {
    throw new ValidationError(result.issues);
  }

  return result.data;
}

export function unknown(): StandardSchema<unknown, unknown> {
  return createSchema((value) => ok(value));
}

export function string(): StandardSchema<unknown, string> {
  return createSchema((value) => {
    if (typeof value !== 'string') {
      return fail([issue('Expected string', 'string', typeof value)]);
    }

    return ok(value);
  });
}

export function number(): StandardSchema<unknown, number> {
  return createSchema((value) => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return fail([issue('Expected number', 'number', typeof value)]);
    }

    return ok(value);
  });
}

export function boolean(): StandardSchema<unknown, boolean> {
  return createSchema((value) => {
    if (typeof value !== 'boolean') {
      return fail([issue('Expected boolean', 'boolean', typeof value)]);
    }

    return ok(value);
  });
}

export function literal<TValue extends string | number | boolean | null>(
  expected: TValue,
): StandardSchema<unknown, TValue> {
  return createSchema((value) => {
    if (value !== expected) {
      return fail([issue(`Expected literal ${String(expected)}`)]);
    }

    return ok(expected);
  });
}

export function optional<TSchema extends StandardSchema<any, any>>(
  schema: TSchema,
): StandardSchema<unknown, InferOutput<TSchema> | undefined> {
  return createSchema((value) => {
    if (value === undefined) {
      return ok(undefined);
    }

    return schema['~standard'].validate(value) as StandardResult<InferOutput<TSchema> | undefined>;
  });
}

export function array<TSchema extends StandardSchema<any, any>>(
  itemSchema: TSchema,
): StandardSchema<unknown, Array<InferOutput<TSchema>>> {
  return createSchema((value) => {
    if (!Array.isArray(value)) {
      return fail([issue('Expected array', 'array', typeof value)]);
    }

    const output: Array<InferOutput<TSchema>> = [];
    const issues: StandardIssue[] = [];

    for (let index = 0; index < value.length; index += 1) {
      const result = itemSchema['~standard'].validate(value[index]);
      if (isFailure(result)) {
        issues.push(...withPath(index, result.issues));
        continue;
      }
      output.push(result.value as InferOutput<TSchema>);
    }

    if (issues.length > 0) {
      return fail(issues);
    }

    return ok(output);
  });
}

export function record<TSchema extends StandardSchema<any, any>>(
  valueSchema: TSchema,
): StandardSchema<unknown, Record<string, InferOutput<TSchema>>> {
  return createSchema((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return fail([issue('Expected object record', 'object', value === null ? 'null' : typeof value)]);
    }

    const source = value as Record<string, unknown>;
    const output: Record<string, InferOutput<TSchema>> = {};
    const issues: StandardIssue[] = [];

    for (const [key, fieldValue] of Object.entries(source)) {
      const result = valueSchema['~standard'].validate(fieldValue);
      if (isFailure(result)) {
        issues.push(...withPath(key, result.issues));
        continue;
      }
      output[key] = result.value as InferOutput<TSchema>;
    }

    if (issues.length > 0) {
      return fail(issues);
    }

    return ok(output);
  });
}

type Shape = Record<string, StandardSchema<any, any>>;

type ShapeOutput<TShape extends Shape> = {
  [TKey in keyof TShape]: InferOutput<TShape[TKey]>;
};

export function object<TShape extends Shape>(
  shape: TShape,
): StandardSchema<unknown, ShapeOutput<TShape>> {
  return createSchema((value) => {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return fail([issue('Expected object', 'object', value === null ? 'null' : typeof value)]);
    }

    const source = value as Record<string, unknown>;
    const output = {} as ShapeOutput<TShape>;
    const issues: StandardIssue[] = [];

    for (const key of Object.keys(shape) as Array<keyof TShape>) {
      const fieldSchema = shape[key];
      const result = fieldSchema['~standard'].validate(source[key as string]);
      if (isFailure(result)) {
        issues.push(...withPath(key as string, result.issues));
        continue;
      }
      output[key] = result.value as ShapeOutput<TShape>[typeof key];
    }

    if (issues.length > 0) {
      return fail(issues);
    }

    return ok(output);
  });
}

export function union<const TSchemas extends readonly [StandardSchema<any, any>, ...StandardSchema<any, any>[]]>(
  schemas: TSchemas,
): StandardSchema<unknown, InferOutput<TSchemas[number]>> {
  return createSchema((value) => {
    const collected: StandardIssue[] = [];

    for (const schema of schemas) {
      const result = schema['~standard'].validate(value);
      if (!isFailure(result)) {
        return ok(result.value as InferOutput<TSchemas[number]>);
      }
      collected.push(...result.issues);
    }

    if (collected.length === 0) {
      return fail([issue('No union variant matched')]);
    }

    return fail(collected);
  });
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
export function func(): StandardSchema<unknown, Function> {
  return createSchema((value) => {
    if (typeof value !== 'function') {
      return fail([issue('Expected function', 'function', typeof value)]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return ok(value as Function);
  });
}
