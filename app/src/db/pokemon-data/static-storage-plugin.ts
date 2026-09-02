import type { StoragePlugin } from '@pokedb2/db';

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

// The Pokémon data set ships as a build artifact and is never mutated, so writes are dropped.
export class StaticStoragePlugin implements StoragePlugin {
    private readonly base64: string;

    constructor(base64: string) {
        this.base64 = base64;
    }

    read(): Uint8Array {
        return base64ToBytes(this.base64);
    }

    write(): void {}
}
