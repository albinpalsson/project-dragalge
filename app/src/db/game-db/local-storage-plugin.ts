import type { StoragePlugin } from '@pokedb2/db';

// localStorage stores UTF-16 strings; byte values 0-255 round-trip safely as char codes.
function bytesToString(bytes: Uint8Array): string {
    let out = '';
    for (const byte of bytes) {
        out += String.fromCharCode(byte);
    }
    return out;
}

function stringToBytes(value: string): Uint8Array {
    return Uint8Array.from(value, (c) => c.charCodeAt(0));
}

export class LocalStoragePlugin implements StoragePlugin {
    private readonly storageKey: string;

    constructor(version: number) {
        this.storageKey = `pokedb2:game-db:v${version}`;
    }

    read(): Uint8Array | null {
        const stored = window.localStorage.getItem(this.storageKey);
        return stored === null ? null : stringToBytes(stored);
    }

    write(blob: Uint8Array): void {
        window.localStorage.setItem(this.storageKey, bytesToString(blob));
    }
}
