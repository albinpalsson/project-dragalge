/** Internal: normalizes anything thrown by a query/mutation fn into an Error. */
export function toError(value: unknown): Error {
    if (value instanceof Error) {
        return value;
    }
    return new Error(String(value), { cause: value });
}
