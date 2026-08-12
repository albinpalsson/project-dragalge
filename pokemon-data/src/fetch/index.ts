export interface CachedFetcher {
    get(url: string): Promise<string>;
}

export const fetcher: CachedFetcher = {
        async get(url: string): Promise<string> {
            throw new Error('Real HTTP fetch + cache is not implemented yet.');
        },
};
