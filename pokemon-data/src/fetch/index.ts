export interface CachedFetcher {
    get(url: string): Promise<string>;
}

export function createUnimplementedFetcher(): CachedFetcher {
    return {
        async get(): Promise<string> {
            throw new Error('Real HTTP fetch + cache is not implemented yet.');
        },
    };
}
