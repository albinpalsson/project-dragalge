import {
    clearGoogleToken,
    getGoogleToken,
    GoogleAuthError,
    whenSignedIn,
} from './google-auth';

const FILES_URL = 'https://www.googleapis.com/drive/v3/files';
const UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files';
const FILE_FIELDS = 'id,md5Checksum';

// Google answered, but not with success, or (status 0) could not be reached.
// UnexpectedErrorBoundary matches it by name.
export class DriveRequestError extends Error {
    constructor(readonly status: number) {
        super(
            status === 0
                ? 'Google Drive could not be reached.'
                : `Google Drive request failed (${status}).`,
        );
        this.name = 'DriveRequestError';
    }
}

export interface DriveFile {
    id: string;
    // Changes whenever the content does.
    rev: string;
}

interface RawDriveFile {
    id: string;
    md5Checksum?: string;
}

async function driveFetch(
    url: string,
    init: RequestInit = {},
): Promise<Response> {
    let token = getGoogleToken();
    if (!token) {
        // The sign-out timer can run late (a sleeping laptop, a throttled tab),
        // so the app may still count as signed in: sign out now and wait.
        clearGoogleToken();
        await whenSignedIn();
        token = getGoogleToken();
    }
    if (!token) {
        throw new GoogleAuthError();
    }
    const response = await fetch(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
    }).catch(() => {
        throw new DriveRequestError(0);
    });
    if (response.status === 401) {
        clearGoogleToken();
        throw new GoogleAuthError();
    }
    if (!response.ok) {
        throw new DriveRequestError(response.status);
    }
    return response;
}

function toDriveFile(file: RawDriveFile): DriveFile {
    return { id: file.id, rev: file.md5Checksum ?? '' };
}

// The signed-in user. Google may leave the email out if the user hides it.
export async function getDriveUser(): Promise<{
    displayName?: string;
    emailAddress?: string;
}> {
    const response = await driveFetch(
        'https://www.googleapis.com/drive/v3/about?fields=user(displayName,emailAddress)',
    );
    const about = (await response.json()) as {
        user?: { displayName?: string; emailAddress?: string };
    };
    return about.user ?? {};
}

// The oldest file with this name in the app's hidden folder. Two devices that
// first save at the same moment can create two; every device then agrees on
// the older one.
export async function findDriveFile(
    name: string,
): Promise<DriveFile | undefined> {
    const params = new URLSearchParams({
        spaces: 'appDataFolder',
        q: `name = '${name.replace(/'/g, "\\'")}' and trashed = false`,
        orderBy: 'createdTime',
        pageSize: '1',
        fields: `files(${FILE_FIELDS})`,
    });
    const page = (await (await driveFetch(`${FILES_URL}?${params}`)).json()) as {
        files?: RawDriveFile[];
    };
    return page.files?.[0] ? toDriveFile(page.files[0]) : undefined;
}

export async function createDriveFile(name: string): Promise<DriveFile> {
    const response = await driveFetch(`${FILES_URL}?fields=${FILE_FIELDS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
        body: JSON.stringify({ name, parents: ['appDataFolder'] }),
    });
    return toDriveFile((await response.json()) as RawDriveFile);
}

export async function getDriveRev(id: string): Promise<string> {
    const response = await driveFetch(
        `${FILES_URL}/${encodeURIComponent(id)}?fields=${FILE_FIELDS}`,
    );
    return toDriveFile((await response.json()) as RawDriveFile).rev;
}

export async function downloadDriveFile(id: string): Promise<Uint8Array> {
    const response = await driveFetch(
        `${FILES_URL}/${encodeURIComponent(id)}?alt=media`,
    );
    return new Uint8Array(await response.arrayBuffer());
}

// Replaces the file's content and returns its new revision.
export async function uploadDriveFile(
    id: string,
    bytes: Uint8Array,
): Promise<string> {
    const response = await driveFetch(
        `${UPLOAD_URL}/${encodeURIComponent(id)}?uploadType=media&fields=${FILE_FIELDS}`,
        {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/octet-stream' },
            body: bytes as BodyInit,
        },
    );
    return toDriveFile((await response.json()) as RawDriveFile).rev;
}
