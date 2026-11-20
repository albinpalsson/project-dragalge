import type { StoragePlugin } from '@project-dragalge/db';
import { gzipDecode, gzipEncode } from '../../utils/compression';
import {
    createDriveFile,
    downloadDriveFile,
    findDriveFile,
    getDriveRev,
    uploadDriveFile,
} from '../../storage/drive-api';
import { whenSignedIn } from '../../storage/google-auth';
import { GameDbOwnershipError } from './local-storage-plugin';

// An upload takes a second or two, so saving waits for the edits to pause
// instead of uploading after every one.
const SAVE_DELAY_MS = 1000;

// Keeps the whole game database in one file in the user's hidden Google Drive
// app folder. There is no local copy and no merging: a save that would
// overwrite something another device or tab saved is refused instead, which
// the app reports like any other lost ownership.
export class GoogleDriveStoragePlugin implements StoragePlugin {
    private readonly fileName: string;
    // The file and the revision of it that this tab last read or wrote.
    private fileId: string | undefined;
    private knownRev: string | undefined;
    // The newest database not yet uploaded. Each one is the whole database, so
    // an older one is never worth uploading.
    private pending: Uint8Array | undefined;
    private timer: ReturnType<typeof setTimeout> | undefined;
    private uploading = false;

    constructor(version: number) {
        this.fileName = `game-db-v${version}.bin`;
    }

    // Waits for a sign-in instead of failing, so the app can start before the
    // user has signed in. Other failures propagate: starting from an empty
    // database because Drive could not be read would hide the user's games.
    async read(): Promise<Uint8Array | null> {
        await whenSignedIn();
        const file = await findDriveFile(this.fileName);
        if (!file) {
            return null;
        }
        this.fileId = file.id;
        this.knownRev = file.rev;
        return gzipDecode(await downloadDriveFile(file.id));
    }

    // The upload happens later, so a failure cannot be returned to the caller:
    // it surfaces as an unhandled rejection, which reaches the app's
    // unexpected-error dialog.
    write(blob: Uint8Array): void {
        this.pending = blob;
        clearTimeout(this.timer);
        this.timer = setTimeout(() => void this.flush(), SAVE_DELAY_MS);
    }

    // One upload at a time. Whatever arrives during an upload is picked up
    // right after it, and only the newest of those is uploaded.
    private async flush(): Promise<void> {
        if (this.uploading) {
            return;
        }
        this.uploading = true;
        try {
            while (this.pending) {
                // A save that falls due while signed out waits for the next
                // sign-in, and then uploads whatever is newest by then.
                await whenSignedIn();
                const blob = this.pending;
                this.pending = undefined;
                if (blob) {
                    await this.upload(blob);
                }
            }
        } finally {
            this.uploading = false;
        }
    }

    private async upload(blob: Uint8Array): Promise<void> {
        const bytes = await gzipEncode(blob);
        if (this.fileId === undefined) {
            // No file was found when loading. If one exists now, another
            // device saved first, and this tab must not replace it.
            if (await findDriveFile(this.fileName)) {
                throw new GameDbOwnershipError();
            }
            const created = await createDriveFile(this.fileName);
            this.fileId = created.id;
        } else if ((await getDriveRev(this.fileId)) !== this.knownRev) {
            throw new GameDbOwnershipError();
        }
        this.knownRev = await uploadDriveFile(this.fileId, bytes);
    }
}
