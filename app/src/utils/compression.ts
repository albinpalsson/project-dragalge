const BASE64_CHUNK_SIZE = 0x8000;

export async function gzipEncode(bytes: Uint8Array): Promise<Uint8Array> {
    return transform(bytes, new CompressionStream('gzip'));
}

export async function gzipDecode(bytes: Uint8Array): Promise<Uint8Array> {
    return transform(bytes, new DecompressionStream('gzip'));
}

export function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
        binary += String.fromCharCode(
            ...bytes.subarray(offset, offset + BASE64_CHUNK_SIZE),
        );
    }
    return btoa(binary);
}

export function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function transform(
    bytes: Uint8Array,
    stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
    const writer = stream.writable.getWriter();
    const writing = writer
        .write(Uint8Array.from(bytes))
        .then(() => writer.close());

    const chunks: Uint8Array[] = [];
    const reader = stream.readable.getReader();
    let length = 0;
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        }
        chunks.push(value);
        length += value.length;
    }
    await writing;

    const result = new Uint8Array(length);
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}