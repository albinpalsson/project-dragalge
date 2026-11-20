import {
    setStorageMode,
    type StorageMode,
} from '../db/game-db/storage-mode';
import { setStoredGameName } from '../game-view-storage';

// Makes `mode` the place games are kept and restarts the app on Home. The
// other place is left exactly as it is.
export function switchStorage(mode: StorageMode): void {
    setStorageMode(mode);
    // The game that was open belongs to the place being left.
    setStoredGameName(null);
    window.location.replace(window.location.pathname);
}
