import { isDriveConfigured } from '../../storage/config';

// Where this browser keeps the games. The two places are separate sets of
// games: the app shows and edits only the selected one.
export type StorageMode = 'local' | 'google-drive';

const STORAGE_KEY = 'paldea-nuzlocke-guide:storage-mode';

export function getStorageMode(): StorageMode {
    // A build without a Google client id cannot reach Drive, whatever was saved.
    if (!isDriveConfigured) {
        return 'local';
    }
    try {
        return window.localStorage.getItem(STORAGE_KEY) === 'google-drive'
            ? 'google-drive'
            : 'local';
    } catch {
        return 'local';
    }
}

export function setStorageMode(mode: StorageMode): void {
    window.localStorage.setItem(STORAGE_KEY, mode);
}
