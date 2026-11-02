import type { StoragePlugin } from '@project-dragalge/db';

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
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
