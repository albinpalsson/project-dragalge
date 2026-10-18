import type { StoragePlugin } from '@project-dragalge/db';

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

export class GameDbOwnershipError extends Error {
    constructor() {
        super('Another tab has taken ownership of the game database.');
        this.name = 'GameDbOwnershipError';
    }
}

export class LocalStoragePlugin implements StoragePlugin {
    private readonly storageKey: string;
    private readonly ownerKey: string;
    private readonly ownerToken: string;

    constructor(version: number) {
        this.storageKey = `paldea-nuzlocke-guide:game-db:v${version}`;
        this.ownerKey = `${this.storageKey}:writer`;
        this.ownerToken = crypto.randomUUID();
        window.localStorage.setItem(this.ownerKey, this.ownerToken);
    }

    read(): Uint8Array | null {
        const stored = window.localStorage.getItem(this.storageKey);
        return stored === null ? null : stringToBytes(stored);
    }

    write(blob: Uint8Array): void {
        if (window.localStorage.getItem(this.ownerKey) !== this.ownerToken) {
            throw new GameDbOwnershipError();
        }
        window.localStorage.setItem(this.storageKey, bytesToString(blob));
    }
}
