export type StandardPathSegment = string | number;

export interface StandardIssue {
	message: string;
	path: StandardPathSegment[];
	expected?: string;
	received?: string;
}

export type StandardResult<T> = { value: T } | { issues: StandardIssue[] };

interface StandardTypeSlot<Input, Output> {
	input: Input;
	output: Output;
}

export interface StandardSchema<Input = unknown, Output = Input> {
	readonly "~standard": {
		readonly version: 1;
		readonly vendor: "@pokedb2/validator";
		validate: (value: unknown) => StandardResult<Output>;
		readonly types?: StandardTypeSlot<Input, Output>;
	};
}

export type InferOutput<TSchema extends StandardSchema<any, any>> =
	TSchema extends StandardSchema<any, infer TOutput> ? TOutput : never;
