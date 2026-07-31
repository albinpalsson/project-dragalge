export function css(
	strings: TemplateStringsArray,
	...values: unknown[]
): string {
	if (values.length > 0) {
		throw new Error(
			"css tagged template values are not supported at runtime. Use static CSS only.",
		);
	}

	// This marker should be replaced by the build-time transform.
	return strings.join("");
}

export function cx(...args: unknown[]): string {
	return args
		.filter((arg): arg is string => typeof arg === "string" && arg.length > 0)
		.join(" ");
}
