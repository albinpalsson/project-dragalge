let request: Promise<void> | undefined;

// Asks the browser to exempt this origin's storage from automatic eviction.
// Best-effort: Chromium decides silently from engagement signals, Firefox
// prompts the user, and a denial (or missing support) is a normal outcome that
// must never affect saving. A denial is not remembered, so a later page load
// asks again. Memoized so one page load issues at most one request.
export function requestPersistentStorage(): Promise<void> {
    request ??= requestOnce();
    return request;
}

async function requestOnce(): Promise<void> {
    try {
        const storage = navigator.storage as StorageManager | undefined;
        if (!storage?.persist || !storage.persisted) {
            return;
        }
        if (await storage.persisted()) {
            return;
        }
        if (await isPermissionDenied()) {
            return;
        }
        await storage.persist();
    } catch (error) {
        console.error('Could not request persistent storage.', error);
    }
}

// Not every browser supports querying this permission; treat that as "not denied".
async function isPermissionDenied(): Promise<boolean> {
    try {
        const status = await navigator.permissions.query({
            name: 'persistent-storage',
        });
        return status.state === 'denied';
    } catch {
        return false;
    }
}
